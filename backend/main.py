from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import json

from matching import rank_ngos

from ai_service import (
    generate_match_explanation,
    generate_csr_plan,
    evaluate_proposal
)

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)

from auth_db import (
    init_db,
    create_user,
    get_user_by_email,
    get_user_by_id
)


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="ImpactBridge API",
    description="AI-powered CSR-NGO matching, tender and project management platform",
    version="3.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE
# ============================================================

init_db()


# ============================================================
# LOAD DATA
# ============================================================

with open("ngos.json", "r") as file:
    ngos = json.load(file)

with open("tenders.json", "r") as file:
    tenders = json.load(file)

with open("projects.json", "r") as file:
    projects = json.load(file)


# ============================================================
# PYDANTIC MODELS
# ============================================================

class CSRProject(BaseModel):
    domain: str
    location: str
    beneficiary: str
    budget: int = Field(..., gt=0)
    expertise: str


class TenderCreate(BaseModel):
    title: str
    company: str
    description: str
    domain: str
    location: str
    beneficiary: str
    budget: int = Field(..., gt=0)
    expected_beneficiaries: int = Field(..., gt=0)


class TenderApplication(BaseModel):
    ngo_id: int
    proposal: str
    proposed_budget: int = Field(..., gt=0)
    expected_beneficiaries: int = Field(..., gt=0)


class SelectNGORequest(BaseModel):
    ngo_id: int


class CSRPlanRequest(BaseModel):
    objective: str
    budget: int = Field(..., gt=0)
    location: str
    beneficiary: str


class NGOComparisonRequest(BaseModel):
    ngo_ids: list[int]


class ProjectCreate(BaseModel):
    tender_id: int
    project_name: str
    description: str
    duration_months: int = Field(..., gt=0)


class ProgressUpdate(BaseModel):
    beneficiaries_reached: int = Field(..., ge=0)
    schools_reached: int = Field(..., ge=0)
    teachers_trained: int = Field(..., ge=0)
    budget_used: int = Field(..., ge=0)
    completion_percentage: int = Field(..., ge=0, le=100)


class AllocationRequest(BaseModel):
    total_budget: int = Field(..., gt=0)
    priorities: list[str]


class AIExplainMatchRequest(BaseModel):
    csr_project: dict
    ngo_id: int


# ============================================================
# AUTH MODELS
# ============================================================

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ============================================================
# AUTHENTICATION
# ============================================================

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        payload = decode_access_token(
            credentials.credentials
        )

        user_id = int(
            payload.get("sub")
        )

    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user = get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    user.pop("password_hash", None)

    return user


# ============================================================
# AUTH — REGISTER
# ============================================================

@app.post("/api/auth/register")
def register(request: RegisterRequest):

    name = request.name.strip()
    email = request.email.strip().lower()
    role = request.role.strip().lower()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name is required"
        )

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required"
        )

    if role not in ["corporate", "ngo"]:
        raise HTTPException(
            status_code=400,
            detail="Role must be corporate or ngo"
        )

    if len(request.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters"
        )

    existing_user = get_user_by_email(email)

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    password_hash = hash_password(
        request.password
    )

    user = create_user(
        name=name,
        email=email,
        password_hash=password_hash,
        role=role
    )

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    user.pop("password_hash", None)

    return {
        "message": "Registration successful",
        "user": user
    }


# ============================================================
# AUTH — LOGIN
# ============================================================

@app.post("/api/auth/login")
def login(request: LoginRequest):

    email = request.email.strip().lower()

    user = get_user_by_email(email)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        request.password,
        user["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token({
        "sub": str(user["id"]),
        "role": user["role"]
    })

    user.pop("password_hash", None)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


# ============================================================
# AUTH — CURRENT USER
# ============================================================

@app.get("/api/auth/me")
def get_me(
    current_user=Depends(get_current_user)
):
    return current_user


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def save_tenders():
    with open("tenders.json", "w") as file:
        json.dump(tenders, file, indent=4)


def save_projects():
    with open("projects.json", "w") as file:
        json.dump(projects, file, indent=4)


def find_ngo(ngo_id):
    return next(
        (
            ngo
            for ngo in ngos
            if ngo["id"] == ngo_id
        ),
        None
    )


def find_tender(tender_id):
    return next(
        (
            tender
            for tender in tenders
            if tender["id"] == tender_id
        ),
        None
    )


def find_project(project_id):
    return next(
        (
            project
            for project in projects
            if project["id"] == project_id
        ),
        None
    )


def calculate_budget_score(
    proposed_budget,
    tender_budget
):

    if proposed_budget <= 0:
        return 0

    if proposed_budget <= tender_budget:
        return 100

    difference_percentage = (
        (proposed_budget - tender_budget)
        / tender_budget
    ) * 100

    if difference_percentage <= 5:
        return 96

    if difference_percentage <= 10:
        return 90

    if difference_percentage <= 20:
        return 80

    if difference_percentage <= 30:
        return 70

    return 50


def calculate_beneficiary_score(
    proposed_beneficiaries,
    target_beneficiaries
):

    if target_beneficiaries <= 0:
        return 0

    ratio = (
        proposed_beneficiaries
        / target_beneficiaries
    )

    if ratio >= 1:
        return 100

    if ratio >= 0.9:
        return 95

    if ratio >= 0.75:
        return 85

    if ratio >= 0.5:
        return 70

    return 50


# ============================================================
# ROOT / HEALTH
# ============================================================

@app.get("/")
def root():

    return {
        "message": "ImpactBridge backend is running 🚀",
        "version": "3.0.0"
    }


@app.get("/health")
def health():

    return {
        "status": "healthy"
    }


# ============================================================
# NGO ENDPOINTS
# ============================================================

@app.get("/api/ngos")
def get_ngos():
    return ngos


@app.get("/api/ngos/{ngo_id}")
def get_ngo(ngo_id: int):

    ngo = find_ngo(ngo_id)

    if ngo is None:
        raise HTTPException(
            status_code=404,
            detail="NGO not found"
        )

    return ngo


# ============================================================
# NGO MATCHING
# ============================================================

@app.post("/api/match")
def match_ngos(csr: CSRProject):

    csr_data = csr.model_dump()

    results = rank_ngos(
        ngos,
        csr_data
    )

    return {
        "csr_project": csr_data,
        "total_ngos_evaluated": len(ngos),
        "matches": results
    }


# ============================================================
# NGO COMPARISON
# ============================================================

@app.post("/api/ngos/compare")
def compare_ngos(
    request: NGOComparisonRequest
):

    if len(request.ngo_ids) < 2:
        raise HTTPException(
            status_code=400,
            detail="Select at least 2 NGOs for comparison"
        )

    selected_ngos = []

    for ngo_id in request.ngo_ids:

        ngo = find_ngo(ngo_id)

        if ngo is None:
            raise HTTPException(
                status_code=404,
                detail=f"NGO {ngo_id} not found"
            )

        selected_ngos.append({
            "id": ngo["id"],
            "name": ngo["name"],
            "domains": ngo["domains"],
            "locations": ngo["locations"],
            "beneficiaries": ngo["beneficiaries"],
            "expertise": ngo["expertise"],
            "budget_min": ngo["budget_min"],
            "budget_max": ngo["budget_max"],
            "years_experience": ngo["years_experience"],
            "projects_completed": ngo["projects_completed"],
            "performance_score": ngo["performance_score"]
        })

    return {
        "total_ngos": len(selected_ngos),
        "ngos": selected_ngos
    }


# ============================================================
# SMART CSR PROJECT PLANNER
# ============================================================

@app.post("/api/csr/generate-plan")
def generate_csr_plan_rule_based(
    request: CSRPlanRequest
):

    objective = request.objective.lower()

    suggested_expertise = "Community Development"
    suggested_kpis = []

    if (
        "education" in objective
        or "student" in objective
        or "school" in objective
    ):

        suggested_expertise = "Digital Education"

        suggested_kpis = [
            "Students reached",
            "Schools covered",
            "Teachers trained",
            "Digital literacy improvement"
        ]

    elif "health" in objective:

        suggested_expertise = "Primary Healthcare"

        suggested_kpis = [
            "People reached",
            "Health camps conducted",
            "Medical screenings completed",
            "Healthcare referrals"
        ]

    elif (
        "environment" in objective
        or "climate" in objective
    ):

        suggested_expertise = "Climate Action"

        suggested_kpis = [
            "Trees planted",
            "Water saved",
            "Waste reduced",
            "Communities reached"
        ]

    elif "women" in objective:

        suggested_expertise = "Vocational Training"

        suggested_kpis = [
            "Women trained",
            "Jobs created",
            "Businesses started",
            "Income improvement"
        ]

    else:

        suggested_kpis = [
            "Beneficiaries reached",
            "Projects completed",
            "Communities covered",
            "Impact improvement"
        ]

    return {
        "objective": request.objective,
        "budget": request.budget,
        "location": request.location,
        "beneficiary": request.beneficiary,
        "suggested_expertise": suggested_expertise,
        "suggested_kpis": suggested_kpis,
        "recommended_budget_allocation": {
            "implementation": round(
                request.budget * 0.70
            ),
            "monitoring": round(
                request.budget * 0.10
            ),
            "infrastructure": round(
                request.budget * 0.15
            ),
            "contingency": round(
                request.budget * 0.05
            )
        }
    }


# ============================================================
# TENDER MANAGEMENT
# ============================================================

@app.get("/api/tenders")
def get_tenders():

    return {
        "total_tenders": len(tenders),
        "tenders": tenders
    }


@app.post("/api/tenders")
def create_tender(
    tender: TenderCreate
):

    new_id = (
        max(
            [t["id"] for t in tenders],
            default=0
        )
        + 1
    )

    new_tender = {
        "id": new_id,
        "title": tender.title,
        "company": tender.company,
        "description": tender.description,
        "domain": tender.domain,
        "location": tender.location,
        "beneficiary": tender.beneficiary,
        "budget": tender.budget,
        "expected_beneficiaries":
            tender.expected_beneficiaries,
        "status": "OPEN",
        "applications": [],
        "selected_ngo_id": None,
        "selected_ngo_name": None
    }

    tenders.append(new_tender)

    save_tenders()

    return {
        "message": "Tender created successfully",
        "tender": new_tender
    }


@app.get("/api/tenders/{tender_id}")
def get_tender(tender_id: int):

    tender = find_tender(tender_id)

    if tender is None:
        raise HTTPException(
            status_code=404,
            detail="Tender not found"
        )

    return tender


# ============================================================
# TENDER APPLICATION
# ============================================================

@app.post("/api/tenders/{tender_id}/apply")
def apply_to_tender(
    tender_id: int,
    application: TenderApplication
):

    tender = find_tender(tender_id)

    if tender is None:
        raise HTTPException(
            status_code=404,
            detail="Tender not found"
        )

    if tender.get("status") != "OPEN":
        raise HTTPException(
            status_code=400,
            detail="Tender is not open for applications"
        )

    ngo = find_ngo(application.ngo_id)

    if ngo is None:
        raise HTTPException(
            status_code=404,
            detail="NGO not found"
        )

    if "applications" not in tender:
        tender["applications"] = []

    for existing in tender["applications"]:

        if existing["ngo_id"] == application.ngo_id:

            raise HTTPException(
                status_code=400,
                detail="This NGO has already applied to the tender"
            )

    application_id = (
        len(tender["applications"]) + 1
    )

    new_application = {
        "application_id": application_id,
        "ngo_id": application.ngo_id,
        "ngo_name": ngo["name"],
        "proposal": application.proposal,
        "proposed_budget":
            application.proposed_budget,
        "expected_beneficiaries":
            application.expected_beneficiaries
    }

    tender["applications"].append(
        new_application
    )

    save_tenders()

    return {
        "message": "Application submitted successfully",
        "application": new_application
    }


# ============================================================
# GET APPLICATIONS
# ============================================================

@app.get("/api/tenders/{tender_id}/applications")
def get_applications(tender_id: int):

    tender = find_tender(tender_id)

    if tender is None:
        raise HTTPException(
            status_code=404,
            detail="Tender not found"
        )

    return {
        "tender_id": tender_id,
        "tender_title": tender["title"],
        "total_applications":
            len(
                tender.get(
                    "applications",
                    []
                )
            ),
        "applications":
            tender.get(
                "applications",
                []
            )
    }


# ============================================================
# TENDER EVALUATION
# ============================================================

@app.post("/api/tenders/{tender_id}/evaluate")
def evaluate_tender(tender_id: int):

    tender = find_tender(tender_id)

    if tender is None:
        raise HTTPException(
            status_code=404,
            detail="Tender not found"
        )

    applications = tender.get(
        "applications",
        []
    )

    if not applications:
        raise HTTPException(
            status_code=400,
            detail="No applications available for evaluation"
        )

    ranked_applicants = []

    for application in applications:

        ngo = find_ngo(
            application["ngo_id"]
        )

        if ngo is None:
            continue

        csr_data = {
            "domain":
                tender["domain"],
            "location":
                tender["location"],
            "beneficiary":
                tender["beneficiary"],
            "budget":
                tender["budget"],
            "expertise":
                application.get(
                    "proposal",
                    ""
                )
        }

        match_results = rank_ngos(
            [ngo],
            csr_data
        )

        match_result = match_results[0]

        match_score = (
            match_result["match_score"]
        )

        impact_score = (
            match_result["impact_score"]
        )

        risk_score = (
            match_result["risk_score"]
        )

        risk_level = (
            match_result["risk_level"]
        )

        budget_score = calculate_budget_score(
            application["proposed_budget"],
            tender["budget"]
        )

        beneficiary_score = (
            calculate_beneficiary_score(
                application[
                    "expected_beneficiaries"
                ],
                tender[
                    "expected_beneficiaries"
                ]
            )
        )

        final_score = round(
            (
                match_score * 0.70
                + budget_score * 0.20
                + beneficiary_score * 0.10
            ),
            2
        )

        ranked_applicants.append({

            "application_id":
                application["application_id"],

            "ngo_id":
                ngo["id"],

            "ngo_name":
                ngo["name"],

            "proposal":
                application["proposal"],

            "match_score":
                match_score,

            "impact_score":
                impact_score,

            "risk_score":
                risk_score,

            "risk_level":
                risk_level,

            "budget_score":
                budget_score,

            "expected_beneficiaries":
                application[
                    "expected_beneficiaries"
                ],

            "beneficiary_score":
                beneficiary_score,

            "proposed_budget":
                application[
                    "proposed_budget"
                ],

            "final_score":
                final_score,

            "why_this_ngo":
                match_result[
                    "why_this_ngo"
                ]
        })

    ranked_applicants.sort(
        key=lambda x: x["final_score"],
        reverse=True
    )

    for index, applicant in enumerate(
        ranked_applicants,
        start=1
    ):

        applicant["rank"] = index

    tender["evaluation"] = {

        "ngo_match": "70%",
        "budget_fit": "20%",
        "beneficiary_reach": "10%",

        "ranked_applicants":
            ranked_applicants
    }

    save_tenders()

    return {

        "tender_id":
            tender_id,

        "tender_title":
            tender["title"],

        "total_applications":
            len(applications),

        "evaluation_method": {

            "ngo_match": "70%",
            "budget_fit": "20%",
            "beneficiary_reach": "10%"
        },

        "ranked_applicants":
            ranked_applicants
    }


# ============================================================
# SELECT NGO
# ============================================================

@app.post("/api/tenders/{tender_id}/select")
def select_ngo(
    tender_id: int,
    request: SelectNGORequest
):

    tender = find_tender(tender_id)

    if tender is None:
        raise HTTPException(
            status_code=404,
            detail="Tender not found"
        )

    ngo = find_ngo(
        request.ngo_id
    )

    if ngo is None:
        raise HTTPException(
            status_code=404,
            detail="NGO not found"
        )

    applications = tender.get(
        "applications",
        []
    )

    applicant = next(
        (
            application
            for application in applications
            if application["ngo_id"]
            == request.ngo_id
        ),
        None
    )

    if applicant is None:
        raise HTTPException(
            status_code=400,
            detail="NGO has not applied to this tender"
        )

    tender["selected_ngo_id"] = ngo["id"]

    tender["selected_ngo_name"] = ngo["name"]

    tender["status"] = "AWARDED"

    tender["selected_application_id"] = (
        applicant["application_id"]
    )

    save_tenders()

    return {

        "message":
            "NGO selected successfully",

        "tender_id":
            tender_id,

        "tender_title":
            tender["title"],

        "selected_ngo": {

            "id":
                ngo["id"],

            "name":
                ngo["name"]
        },

        "status":
            "AWARDED"
    }


# ============================================================
# PROJECT MANAGEMENT
# ============================================================

@app.post("/api/projects")
def create_project(
    project: ProjectCreate
):

    tender = find_tender(
        project.tender_id
    )

    if tender is None:
        raise HTTPException(
            status_code=404,
            detail="Tender not found"
        )

    if tender.get("status") != "AWARDED":
        raise HTTPException(
            status_code=400,
            detail="Tender must be awarded before creating a project"
        )

    selected_ngo_id = (
        tender.get("selected_ngo_id")
    )

    if selected_ngo_id is None:
        raise HTTPException(
            status_code=400,
            detail="No NGO has been selected"
        )

    selected_ngo_name = (
        tender.get("selected_ngo_name")
    )

    new_id = (
        max(
            [p["id"] for p in projects],
            default=0
        )
        + 1
    )

    new_project = {

        "id":
            new_id,

        "tender_id":
            tender["id"],

        "project_name":
            project.project_name,

        "description":
            project.description,

        "company":
            tender.get(
                "company",
                "Corporate"
            ),

        "ngo_id":
            selected_ngo_id,

        "ngo_name":
            selected_ngo_name,

        "domain":
            tender["domain"],

        "location":
            tender["location"],

        "beneficiary":
            tender["beneficiary"],

        "budget":
            tender["budget"],

        "duration_months":
            project.duration_months,

        "status":
            "IN_PROGRESS",

        "completion_percentage":
            0,

        "beneficiaries_reached":
            0,

        "schools_reached":
            0,

        "teachers_trained":
            0,

        "budget_used":
            0,

        "milestones": [

            {
                "id": 1,
                "name": "NGO Onboarding",
                "status": "COMPLETED"
            },

            {
                "id": 2,
                "name": "Community Identification",
                "status": "PENDING"
            },

            {
                "id": 3,
                "name": "Infrastructure Setup",
                "status": "PENDING"
            },

            {
                "id": 4,
                "name": "Program Implementation",
                "status": "PENDING"
            },

            {
                "id": 5,
                "name": "Impact Assessment",
                "status": "PENDING"
            }
        ]
    }

    projects.append(
        new_project
    )

    save_projects()

    return {

        "message":
            "CSR project created successfully",

        "project":
            new_project
    }


@app.get("/api/projects")
def get_projects():

    return {

        "total_projects":
            len(projects),

        "projects":
            projects
    }


@app.get("/api/projects/{project_id}")
def get_project(project_id: int):

    project = find_project(
        project_id
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return project


# ============================================================
# PROJECT PROGRESS
# ============================================================

@app.put("/api/projects/{project_id}/progress")
def update_project_progress(
    project_id: int,
    update: ProgressUpdate
):

    project = find_project(
        project_id
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    if update.budget_used > project["budget"]:
        raise HTTPException(
            status_code=400,
            detail="Budget used cannot exceed project budget"
        )

    project["beneficiaries_reached"] = (
        update.beneficiaries_reached
    )

    project["schools_reached"] = (
        update.schools_reached
    )

    project["teachers_trained"] = (
        update.teachers_trained
    )

    project["budget_used"] = (
        update.budget_used
    )

    project["completion_percentage"] = (
        update.completion_percentage
    )

    if update.completion_percentage >= 100:

        project["status"] = "COMPLETED"

    elif update.completion_percentage > 0:

        project["status"] = "IN_PROGRESS"

    save_projects()

    return {

        "message":
            "Project progress updated",

        "project":
            project
    }


# ============================================================
# COMPLETE MILESTONE
# ============================================================

@app.post(
    "/api/projects/{project_id}/milestones/{milestone_id}/complete"
)
def complete_milestone(
    project_id: int,
    milestone_id: int
):

    project = find_project(
        project_id
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    milestone = next(
        (
            milestone
            for milestone in project["milestones"]
            if milestone["id"] == milestone_id
        ),
        None
    )

    if milestone is None:
        raise HTTPException(
            status_code=404,
            detail="Milestone not found"
        )

    milestone["status"] = "COMPLETED"

    save_projects()

    return {

        "message":
            "Milestone completed",

        "milestone":
            milestone
    }


# ============================================================
# PROJECT IMPACT
# ============================================================

@app.get("/api/projects/{project_id}/impact")
def get_project_impact(
    project_id: int
):

    project = find_project(
        project_id
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    budget = project["budget"]

    budget_utilization = 0

    if budget > 0:

        budget_utilization = round(
            (
                project["budget_used"]
                / budget
            ) * 100,
            2
        )

    completed_milestones = sum(
        1
        for milestone in project["milestones"]
        if milestone["status"] == "COMPLETED"
    )

    total_milestones = len(
        project["milestones"]
    )

    milestone_progress = 0

    if total_milestones > 0:

        milestone_progress = round(
            (
                completed_milestones
                / total_milestones
            ) * 100,
            2
        )

    return {

        "project_id":
            project_id,

        "project_name":
            project["project_name"],

        "ngo":
            project["ngo_name"],

        "budget":
            budget,

        "budget_used":
            project["budget_used"],

        "budget_utilization":
            budget_utilization,

        "beneficiaries_reached":
            project["beneficiaries_reached"],

        "schools_reached":
            project["schools_reached"],

        "teachers_trained":
            project["teachers_trained"],

        "completion_percentage":
            project["completion_percentage"],

        "milestone_progress":
            milestone_progress,

        "status":
            project["status"]
    }


# ============================================================
# CORPORATE DASHBOARD
# ============================================================

@app.get("/api/dashboard")
def get_dashboard():

    total_budget = sum(
        project["budget"]
        for project in projects
    )

    budget_used = sum(
        project["budget_used"]
        for project in projects
    )

    total_beneficiaries = sum(
        project["beneficiaries_reached"]
        for project in projects
    )

    active_projects = sum(
        1
        for project in projects
        if project["status"] == "IN_PROGRESS"
    )

    completed_projects = sum(
        1
        for project in projects
        if project["status"] == "COMPLETED"
    )

    open_tenders = sum(
        1
        for tender in tenders
        if tender.get("status") == "OPEN"
    )

    awarded_tenders = sum(
        1
        for tender in tenders
        if tender.get("status") == "AWARDED"
    )

    return {

        "overview": {

            "total_ngos":
                len(ngos),

            "total_tenders":
                len(tenders),

            "open_tenders":
                open_tenders,

            "awarded_tenders":
                awarded_tenders,

            "active_projects":
                active_projects,

            "completed_projects":
                completed_projects,

            "total_csr_budget":
                total_budget,

            "budget_utilized":
                budget_used,

            "total_beneficiaries":
                total_beneficiaries
        },

        "projects":
            projects,

        "recent_tenders":
            tenders[-5:]
    }


# ============================================================
# CSR BUDGET ALLOCATION
# ============================================================

@app.post("/api/csr/allocate")
def allocate_csr_budget(
    request: AllocationRequest
):

    if not request.priorities:

        raise HTTPException(
            status_code=400,
            detail="At least one priority is required"
        )

    base_percentage = (
        100 / len(request.priorities)
    )

    allocation = []

    remaining = request.total_budget

    for index, priority in enumerate(
        request.priorities
    ):

        if index == len(
            request.priorities
        ) - 1:

            amount = remaining

        else:

            amount = round(
                request.total_budget
                * base_percentage
                / 100
            )

            remaining -= amount

        allocation.append({

            "priority":
                priority,

            "percentage":
                round(
                    base_percentage,
                    2
                ),

            "recommended_amount":
                amount
        })

    return {

        "total_budget":
            request.total_budget,

        "allocation":
            allocation,

        "method":
            "Equal allocation across selected CSR priorities"
    }


# ============================================================
# GEMINI AI — EXPLAIN NGO MATCH
# ============================================================

@app.post("/api/ai/explain-match")
def ai_explain_match(
    request: AIExplainMatchRequest
):

    ngo = find_ngo(
        request.ngo_id
    )

    if ngo is None:

        raise HTTPException(
            status_code=404,
            detail="NGO not found"
        )

    match_results = rank_ngos(
        [ngo],
        request.csr_project
    )

    match_result = match_results[0]

    explanation = generate_match_explanation(
        request.csr_project,
        ngo,
        match_result
    )

    return {

        "ngo_id":
            ngo["id"],

        "ngo_name":
            ngo["name"],

        "match_score":
            match_result["match_score"],

        "impact_score":
            match_result["impact_score"],

        "risk_score":
            match_result["risk_score"],

        "risk_level":
            match_result["risk_level"],

        "why_this_ngo":
            match_result["why_this_ngo"],

        "ai_explanation":
            explanation
    }


# ============================================================
# GEMINI AI — GENERATE CSR PLAN
# ============================================================

@app.post("/api/ai/generate-csr-plan")
def ai_generate_csr_plan(
    request: CSRPlanRequest
):

    plan = generate_csr_plan(
        objective=request.objective,
        budget=request.budget,
        location=request.location,
        beneficiary=request.beneficiary
    )

    return {

        "objective":
            request.objective,

        "budget":
            request.budget,

        "location":
            request.location,

        "beneficiary":
            request.beneficiary,

        "ai_generated_plan":
            plan
    }


# ============================================================
# GEMINI AI — EVALUATE NGO PROPOSAL
# ============================================================

@app.post(
    "/api/ai/evaluate-proposal/{tender_id}/{ngo_id}"
)
def ai_evaluate_proposal(
    tender_id: int,
    ngo_id: int
):

    tender = find_tender(
        tender_id
    )

    if tender is None:

        raise HTTPException(
            status_code=404,
            detail="Tender not found"
        )

    ngo = find_ngo(
        ngo_id
    )

    if ngo is None:

        raise HTTPException(
            status_code=404,
            detail="NGO not found"
        )

    application = next(
        (
            application
            for application
            in tender.get(
                "applications",
                []
            )
            if application["ngo_id"]
            == ngo_id
        ),
        None
    )

    if application is None:

        raise HTTPException(
            status_code=404,
            detail="NGO has not applied to this tender"
        )

    proposal = application.get(
        "proposal",
        ""
    )

    if not proposal:

        raise HTTPException(
            status_code=400,
            detail="Proposal is empty"
        )

    evaluation = evaluate_proposal(
        tender=tender,
        ngo=ngo,
        proposal=proposal
    )

    return {

        "tender_id":
            tender_id,

        "tender_title":
            tender["title"],

        "ngo_id":
            ngo_id,

        "ngo_name":
            ngo["name"],

        "proposal":
            proposal,

        "ai_evaluation":
            evaluation
    }
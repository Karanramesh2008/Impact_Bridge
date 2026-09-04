def normalize_location(value):
    """Normalize a location string for safe comparison."""
    return " ".join(str(value or "").strip().lower().replace(",", " , ").split())


def location_match_points(csr_location, ngo_locations):
    """
    Match a city/state target against NGO operating states.
    Exact state coverage receives full points, while a city without a
    recognizable state does not get a false positive.
    """
    target = normalize_location(csr_location)
    if not target:
        return 0, ""

    target_parts = [part.strip() for part in target.split(",") if part.strip()]
    target_state = target_parts[-1] if target_parts else target

    normalized_ngo_locations = [normalize_location(x) for x in (ngo_locations or [])]

    if target in normalized_ngo_locations:
        return 20, target

    if target_state in normalized_ngo_locations:
        return 20, target_state

    return 0, ""


def calculate_impact_score(ngo, csr):
    """
    Estimate potential impact from the available demo evidence.
    This score does not invent beneficiary counts; reach is reported
    separately as unavailable when the source data has no beneficiary total.
    Score: 0-100
    """
    score = 0

    if csr["domain"] in ngo["domains"]:
        score += 30

    if csr["beneficiary"] in ngo["beneficiaries"]:
        score += 25

    location_points, _ = location_match_points(csr["location"], ngo["locations"])
    if location_points:
        score += 20

    if ngo["years_experience"] >= 10:
        score += 15
    elif ngo["years_experience"] >= 5:
        score += 10
    else:
        score += 5

    score += round(ngo["performance_score"] * 0.10)
    return min(score, 100)


def calculate_risk_score(ngo, csr):
    """Estimate execution risk. Lower score means lower risk."""
    risk = 0

    if ngo["years_experience"] < 3:
        risk += 30
    elif ngo["years_experience"] < 5:
        risk += 20
    elif ngo["years_experience"] < 10:
        risk += 10

    if ngo["performance_score"] < 70:
        risk += 30
    elif ngo["performance_score"] < 80:
        risk += 20
    elif ngo["performance_score"] < 90:
        risk += 10

    if not (ngo["budget_min"] <= csr["budget"] <= ngo["budget_max"]):
        risk += 20

    if csr["domain"] not in ngo["domains"]:
        risk += 15

    location_points, _ = location_match_points(csr["location"], ngo["locations"])
    if location_points == 0:
        risk += 10

    return min(risk, 100)


def get_risk_level(risk_score):
    if risk_score <= 20:
        return "LOW"
    elif risk_score <= 45:
        return "MEDIUM"
    return "HIGH"


def risk_explanation(ngo, csr, risk_score):
    factors = []

    if ngo["years_experience"] < 5:
        factors.append(f"limited operating history ({ngo['years_experience']} years)")
    elif ngo["years_experience"] >= 10:
        factors.append(f"strong operating history ({ngo['years_experience']} years)")

    if ngo["performance_score"] < 80:
        factors.append(f"past performance score is {ngo['performance_score']}/100")
    elif ngo["performance_score"] >= 90:
        factors.append(f"past performance score is strong at {ngo['performance_score']}/100")

    if not (ngo["budget_min"] <= csr["budget"] <= ngo["budget_max"]):
        factors.append("requested budget is outside the NGO's stated project range")

    if csr["domain"] not in ngo["domains"]:
        factors.append("project domain is outside the NGO's listed domains")

    location_points, matched_location = location_match_points(csr["location"], ngo["locations"])
    if location_points == 0:
        factors.append("target geography is not listed in the NGO's operating locations")
    elif matched_location:
        factors.append(f"geographic coverage includes {matched_location.title()}")

    if not factors:
        factors.append("no material risk factors were detected from the available profile data")

    return factors


def calculate_match(ngo, csr):
    score = 0

    # Compatibility weights: 30 + 20 + 15 + 15 + 10 + 5 + 5 = 100.
    domain_match = 30 if csr["domain"] in ngo["domains"] else 0
    score += domain_match

    location_match, matched_location = location_match_points(csr["location"], ngo["locations"])
    score += location_match

    beneficiary_match = 15 if csr["beneficiary"] in ngo["beneficiaries"] else 0
    score += beneficiary_match

    csr_budget = csr["budget"]
    min_budget = ngo["budget_min"]
    max_budget = ngo["budget_max"]

    if min_budget <= csr_budget <= max_budget:
        midpoint = (min_budget + max_budget) / 2
        half_range = (max_budget - min_budget) / 2
        budget_fit = 100 if half_range == 0 else 100 - (abs(csr_budget - midpoint) / half_range) * 40
        budget_fit = round(max(60, min(100, budget_fit)), 2)
    else:
        distance = min_budget - csr_budget if csr_budget < min_budget else csr_budget - max_budget
        range_size = max_budget - min_budget
        budget_fit = 0 if range_size == 0 else 60 - (distance / range_size) * 60
        budget_fit = round(max(0, min(59, budget_fit)), 2)

    budget_match = round((budget_fit / 100) * 15, 2)
    score += budget_match

    expertise_match = 10 if csr["expertise"] in ngo["expertise"] else 0
    score += expertise_match

    if ngo["years_experience"] >= 10:
        experience_match = 5
    elif ngo["years_experience"] >= 5:
        experience_match = 4
    elif ngo["years_experience"] >= 3:
        experience_match = 3
    else:
        experience_match = 2
    score += experience_match

    performance_match = round((ngo["performance_score"] / 100) * 5, 2)
    score += performance_match

    reasons = []
    if domain_match:
        reasons.append(f"Strong {csr['domain']} domain alignment")
    if location_match:
        reasons.append(f"Operates in {matched_location.title()}")
    if beneficiary_match:
        reasons.append(f"Works with {csr['beneficiary']}")
    if budget_fit >= 80:
        reasons.append(f"Budget of ₹{csr['budget']:,} is highly compatible with its project range")
    elif budget_fit >= 60:
        reasons.append(f"Budget of ₹{csr['budget']:,} is compatible with its project range")
    else:
        reasons.append("CSR budget has limited compatibility with its preferred project range")
    if expertise_match:
        reasons.append(f"Has relevant expertise in {csr['expertise']}")
    if ngo["years_experience"] >= 10:
        reasons.append(f"{ngo['years_experience']} years of experience")
    if ngo["performance_score"] >= 90:
        reasons.append(f"Strong past performance score of {ngo['performance_score']}/100")

    impact_score = calculate_impact_score(ngo, csr)
    risk_score = calculate_risk_score(ngo, csr)
    risk_level = get_risk_level(risk_score)

    return {
        "ngo_id": ngo["id"],
        "ngo_name": ngo["name"],
        "match_score": round(score, 2),
        "impact_score": impact_score,
        "budget_fit": budget_fit,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_factors": risk_explanation(ngo, csr, risk_score),
        "why_this_ngo": ". ".join(reasons) + "." if reasons else "Limited alignment with the CSR requirements.",
        "domains": ngo["domains"],
        "locations": ngo["locations"],
        "beneficiaries": ngo["beneficiaries"],
        "expertise": ngo["expertise"],
        "years_experience": ngo["years_experience"],
        "projects_completed": ngo["projects_completed"],
        "performance_score": ngo["performance_score"],
        "budget_min": ngo["budget_min"],
        "budget_max": ngo["budget_max"],
        "verification": {
            "registration": {"status": "NOT_AVAILABLE", "source": "NGO Darpan / registration record"},
            "ngo_darpan": {"status": "NOT_AVAILABLE", "source": "NGO Darpan"},
            "csr_1": {"status": "NOT_AVAILABLE", "source": "MCA CSR-1"},
            "financials": {"status": "NOT_AVAILABLE", "source": "Audited financial statements"},
            "annual_reports": {"status": "NOT_AVAILABLE", "source": "NGO annual reports"}
        },
        "transparency_score": None,
        "transparency_status": "NOT_AVAILABLE",
        "impact_profile": {
            "beneficiary_reach": "Not provided in the current NGO dataset",
            "historical_performance": ngo["performance_score"],
            "delivery_scale": ngo["projects_completed"],
            "geographic_need": 100 if location_match else 0,
            "projected_beneficiaries": "Not provided by CSR input"
        },
        "breakdown": {
            "domain": domain_match,
            "location": location_match,
            "beneficiary": beneficiary_match,
            "budget": budget_match,
            "expertise": expertise_match,
            "experience": experience_match,
            "performance": performance_match
        },
        "breakdown_max": {
            "domain": 30,
            "location": 20,
            "beneficiary": 15,
            "budget": 15,
            "expertise": 10,
            "experience": 5,
            "performance": 5
        }
    }


def rank_ngos(ngos, csr):
    results = [calculate_match(ngo, csr) for ngo in ngos]
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results

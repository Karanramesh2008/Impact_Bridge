def calculate_impact_score(ngo, csr):
    """
    Estimate the potential impact of partnering with this NGO.
    Score: 0-100
    """

    score = 0

    # Domain alignment
    if csr["domain"] in ngo["domains"]:
        score += 30

    # Beneficiary alignment
    if csr["beneficiary"] in ngo["beneficiaries"]:
        score += 25

    # Location coverage
    if csr["location"] in ngo["locations"]:
        score += 20

    # Experience
    if ngo["years_experience"] >= 10:
        score += 15
    elif ngo["years_experience"] >= 5:
        score += 10
    else:
        score += 5

    # Past performance
    score += round(ngo["performance_score"] * 0.10)

    return min(score, 100)


def calculate_risk_score(ngo, csr):
    """
    Estimate execution risk.
    Lower score = lower risk.
    Score: 0-100
    """

    risk = 0

    # Less experience = higher risk
    if ngo["years_experience"] < 3:
        risk += 30
    elif ngo["years_experience"] < 5:
        risk += 20
    elif ngo["years_experience"] < 10:
        risk += 10

    # Lower performance = higher risk
    if ngo["performance_score"] < 70:
        risk += 30
    elif ngo["performance_score"] < 80:
        risk += 20
    elif ngo["performance_score"] < 90:
        risk += 10

    # Budget outside NGO range
    if not (
        ngo["budget_min"]
        <= csr["budget"]
        <= ngo["budget_max"]
    ):
        risk += 20

    # Weak domain alignment
    if csr["domain"] not in ngo["domains"]:
        risk += 15

    return min(risk, 100)


def get_risk_level(risk_score):
    """
    Convert numerical risk into Low / Medium / High.
    """

    if risk_score <= 20:
        return "LOW"
    elif risk_score <= 45:
        return "MEDIUM"
    else:
        return "HIGH"


def calculate_match(ngo, csr):
    """
    Calculate how well an NGO matches a CSR project.
    """

    score = 0

    # 1. Domain Match - 30%
    domain_match = 0

    if csr["domain"] in ngo["domains"]:
        domain_match = 30
        score += domain_match

    # 2. Location Match - 20%
    location_match = 0

    if csr["location"] in ngo["locations"]:
        location_match = 20
        score += location_match

    # 3. Beneficiary Match - 15%
    beneficiary_match = 0

    if csr["beneficiary"] in ngo["beneficiaries"]:
        beneficiary_match = 15
        score += beneficiary_match

    # 4. Budget Fit - 15%
    budget_match = 0

    if ngo["budget_min"] <= csr["budget"] <= ngo["budget_max"]:
        budget_match = 15
        score += budget_match

    elif csr["budget"] < ngo["budget_min"]:
        budget_match = 5
        score += budget_match

    # 5. Expertise Match - 10%
    expertise_match = 0

    if csr["expertise"] in ngo["expertise"]:
        expertise_match = 10
        score += expertise_match

    # 6. Experience - 5%
    if ngo["years_experience"] >= 10:
        experience_match = 5
    elif ngo["years_experience"] >= 5:
        experience_match = 4
    elif ngo["years_experience"] >= 3:
        experience_match = 3
    else:
        experience_match = 2

    score += experience_match

    # 7. Past Performance - 5%
    performance_match = round(
        (ngo["performance_score"] / 100) * 5,
        2
    )

    score += performance_match

    # -----------------------------
    # Explanation
    # -----------------------------

    reasons = []

    if domain_match > 0:
        reasons.append(
            f"Strong {csr['domain']} domain alignment"
        )

    if location_match > 0:
        reasons.append(
            f"Operates in {csr['location']}"
        )

    if beneficiary_match > 0:
        reasons.append(
            f"Works with {csr['beneficiary']}"
        )

    if budget_match == 15:
        reasons.append(
            f"Budget of ₹{csr['budget']:,} fits its project range"
        )

    if expertise_match > 0:
        reasons.append(
            f"Has relevant expertise in {csr['expertise']}"
        )

    if ngo["years_experience"] >= 10:
        reasons.append(
            f"{ngo['years_experience']} years of experience"
        )

    if ngo["performance_score"] >= 90:
        reasons.append(
            f"Strong past performance score of {ngo['performance_score']}/100"
        )

    if reasons:
        explanation = ". ".join(reasons) + "."
    else:
        explanation = "Limited alignment with the CSR requirements."

    # -----------------------------
    # Impact & Risk
    # -----------------------------

    impact_score = calculate_impact_score(ngo, csr)

    risk_score = calculate_risk_score(ngo, csr)

    risk_level = get_risk_level(risk_score)

    return {
        "ngo_id": ngo["id"],
        "ngo_name": ngo["name"],

        "match_score": round(score, 2),

        "impact_score": impact_score,

        "risk_score": risk_score,

        "risk_level": risk_level,

        "why_this_ngo": explanation,

        "breakdown": {
            "domain": domain_match,
            "location": location_match,
            "beneficiary": beneficiary_match,
            "budget": budget_match,
            "expertise": expertise_match,
            "experience": experience_match,
            "performance": performance_match
        }
    }


def rank_ngos(ngos, csr):
    """
    Calculate scores for all NGOs and return them ranked.
    """

    results = []

    for ngo in ngos:
        result = calculate_match(ngo, csr)
        results.append(result)

    # Highest match score first
    results.sort(
        key=lambda x: x["match_score"],
        reverse=True
    )

    return results
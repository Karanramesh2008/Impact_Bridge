import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is missing from .env")

client = genai.Client(api_key=api_key)

MODEL = "gemini-3.7-flash"


def generate_match_explanation(csr_project, ngo, match_result):
    prompt = f"""
You are an expert CSR partnership advisor.

Explain why this NGO is a good match for the company's CSR project.

CSR PROJECT:
{csr_project}

NGO:
{ngo}

MATCH RESULT:
{match_result}

Give a concise professional explanation suitable for a corporate dashboard.

Include:
1. Why the NGO matches
2. Key strengths
3. Any potential concern
4. A final recommendation

Do not invent facts that are not provided.
"""

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt
    )

    return response.text


def generate_csr_plan(objective, budget, location, beneficiary):
    prompt = f"""
You are an expert CSR strategy consultant.

Create a practical CSR project plan.

Objective: {objective}
Budget: ₹{budget:,}
Location: {location}
Beneficiaries: {beneficiary}

Return:
- Project title
- Recommended approach
- 4 key activities
- 5 measurable KPIs
- Expected impact
- Major risks
- Suggested timeline

Keep the answer concise and suitable for a corporate CSR dashboard.
"""

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt
    )

    return response.text


def evaluate_proposal(tender, ngo, proposal):
    prompt = f"""
You are a CSR proposal evaluation expert.

Evaluate the NGO proposal against the CSR tender.

TENDER:
{tender}

NGO:
{ngo}

PROPOSAL:
{proposal}

Evaluate:
1. Proposal quality
2. Alignment with CSR objective
3. Feasibility
4. Expected impact
5. Potential risks
6. Overall recommendation

Give a score from 0-100 and explain the reasoning.

Do not invent information.
"""

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt
    )

    return response.text
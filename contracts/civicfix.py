# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

# =============================================================================
#  civicfix.py — CivicFix Crowdfund: Citizen Satisfaction Escrow Contract
#  GenLayer Intelligent Contract (v0.2.16)
# =============================================================================

from genlayer import *
import json

class Contract(gl.Contract):
    """
    CivicFix Crowdfund — Public Works & Citizen Satisfaction Escrow
    ===============================================================
    A decentralized micro-governance crowdfunding smart contract. Neighbors pool 
    funds to hire a contractor to fix local infrastructure issues (e.g. repaving roads, 
    fixing playgrounds). Funds are held in escrow. 
    
    Upon completion, a forum discussion URL (e.g., Nextdoor, Facebook, or Reddit thread)
    is submitted. GenLayer AI nodes scrape the discussion thread, evaluate citizen
    satisfaction, and audit the results. If nodes agree on the core boolean `is_satisfied`
    verdict, consensus is reached. If satisfied, the funds are automatically released
    to the contractor; otherwise, they remain escrowed pending further fixes.
    """

    # Monotonic project counter
    projects_count:             u64

    # Storage Mappings (Pre-initialized by VM)
    project_creator:            TreeMap[u64, Address]
    project_contractor:         TreeMap[u64, Address]
    project_amount:             TreeMap[u64, u256]
    project_scope:              TreeMap[u64, str]
    project_forum_url:          TreeMap[u64, str]
    project_status:             TreeMap[u64, str]       # "ACTIVE", "APPROVED", "FAILED"
    project_is_satisfied:       TreeMap[u64, bool]
    project_approval_rating:    TreeMap[u64, u256]
    project_sentiment_summary:  TreeMap[u64, str]

    # ═══════════════════════════════════════════════════════════════════
    # CONSTRUCTOR
    # ═══════════════════════════════════════════════════════════════════
    def __init__(self) -> None:
        self.projects_count = 0

    # ═══════════════════════════════════════════════════════════════════
    # PUBLIC WRITE: CREATE PROJECT ESCROW
    # ═══════════════════════════════════════════════════════════════════
    @gl.public.write
    def create_project(self, contractor: Address, scope: str) -> int:
        """
        Create a new public works crowdfunding project and lock funds in escrow.
        """
        amount = int(gl.message.value)
        if amount <= 0:
            raise UserError("Escrow funding must be greater than zero.")

        if len(scope.strip()) == 0:
            raise UserError("Project scope description cannot be empty.")

        if str(contractor) == "0x0000000000000000000000000000000000000000":
            raise UserError("Invalid contractor address.")

        pid = self.projects_count

        self.project_creator[pid] = gl.message.sender_address
        self.project_contractor[pid] = contractor
        self.project_amount[pid] = amount
        self.project_scope[pid] = scope.strip()
        self.project_forum_url[pid] = ""
        self.project_status[pid] = "ACTIVE"
        self.project_is_satisfied[pid] = False
        self.project_approval_rating[pid] = 0
        self.project_sentiment_summary[pid] = "Project initialized. Awaiting completion and community forum audit."

        self.projects_count = int(pid) + 1
        return int(pid)

    # ═══════════════════════════════════════════════════════════════════
    # PUBLIC WRITE: AUDIT CITIZEN SATISFACTION
    # ═══════════════════════════════════════════════════════════════════
    @gl.public.write
    def audit_project_satisfaction(self, project_id: int, forum_discussion_url: str) -> None:
        """
        Scrapes and audits community feedback from the provided discussion URL.
        Releases funds to the contractor if citizens are satisfied.
        """
        if project_id < 0 or project_id >= int(self.projects_count):
            raise UserError("Project does not exist.")

        status = self.project_status.get(project_id, "ACTIVE")
        if status != "ACTIVE" and status != "FAILED":
            raise UserError("Project is not in active or failed state.")

        amount = int(self.project_amount.get(project_id, 0))
        if amount <= 0:
            raise UserError("Escrow has no locked funds.")

        scope = self.project_scope.get(project_id, "")
        contractor = self.project_contractor.get(project_id, Address("0x0000000000000000000000000000000000000000"))

        if len(forum_discussion_url.strip()) == 0:
            raise UserError("Community discussion URL cannot be empty.")

        url_lower = forum_discussion_url.lower().strip()
        if not (url_lower.startswith("http://") or url_lower.startswith("https://")):
            raise UserError("Invalid URL format. Must start with http:// or https://")

        self.project_forum_url[project_id] = forum_discussion_url.strip()
        self.project_status[project_id] = "ACTIVE"
        self.project_sentiment_summary[project_id] = "Public Sentiment Auditor is analyzing neighborhood comments..."

        # ── Non-Deterministic Execution block ───────────────────────────
        def leader_fn() -> str:
            # 1. Scrape community discussion thread
            try:
                forum_raw = gl.nondet.web.render(forum_discussion_url)
                forum_text = forum_raw.strip()
            except Exception as e:
                return json.dumps({
                    "error": "FORUM_SCRAPE_FAILED",
                    "is_satisfied": False,
                    "approval_rating": 0,
                    "sentiment_summary": f"Failed to retrieve or render the community forum URL: {str(e)}"
                })

            # Check if text was returned or is too short
            if len(forum_text) < 15:
                return json.dumps({
                    "error": "EMPTY_DISCUSSION",
                    "is_satisfied": False,
                    "approval_rating": 0,
                    "sentiment_summary": "The community discussion thread appeared to be empty or unreachable. Cannot verify satisfaction."
                })

            forum_excerpt = forum_text[:4000]

            # 2. AI Public Sentiment Auditor prompt
            prompt = f"""You are a "Public Sentiment Auditor" and micro-governance inspector.
Your job is to read comments from a local community forum thread and determine if the neighbors are satisfied with the completed public works job.

Project Scope & Objective:
"{scope}"

Neighborhood Discussion Thread Content:
--- START DISCUSSION TEXT ---
{forum_excerpt}
--- END DISCUSSION TEXT ---

Please analyze the community's feedback under the following guidelines:
1. Examine comments and reactions for positive confirmation (e.g. "Looks great!", "Pothole is finally gone!", "Very clean job", "Kids love the new swings").
2. Check for complaints, structural failures, or unresolved issues (e.g. "They left garbage", "Broke after two days", "Only half of it was repaved", "Contractor did a sloppy job").
3. Determine "is_satisfied" (true or false). Set it to true ONLY if the majority of neighbors confirm the work is completed correctly and they are generally happy/relieved. If there is strong negative sentiment, incomplete work, or no clear confirmation, set "is_satisfied" to false.
4. Calculate an "approval_rating" (integer from 0 to 100) reflecting the proportion of positive sentiment.
5. Summarize the neighbors' feedback in 2-3 concise sentences as the "sentiment_summary".

Your output MUST be a valid JSON object with EXACTLY the following keys:
{{
  "is_satisfied": true | false,
  "approval_rating": <0-100>,
  "sentiment_summary": "<2-3 sentences summarizing resident feedback, highlighting main praises or complaints>"
}}
Do NOT wrap the JSON in markdown code blocks. Do NOT add any extra text or conversational greeting. Return ONLY the raw JSON."""

            try:
                raw_output = gl.nondet.exec_prompt(prompt)
            except Exception as e:
                return json.dumps({
                    "error": f"LLM_EXECUTION_FAILED: {str(e)}",
                    "is_satisfied": False,
                    "approval_rating": 0,
                    "sentiment_summary": "AI node failed to execute public sentiment evaluation."
                })

            cleaned = raw_output.strip()
            # Clean markdown code blocks if present
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                inner = []
                for line in lines[1:]:
                    if line.strip() == "```":
                        break
                    inner.append(line)
                cleaned = "\n".join(inner).strip()

            try:
                parsed = json.loads(cleaned)
                is_sat = bool(parsed.get("is_satisfied", False))
                app_rate = int(parsed.get("approval_rating", 0))
                if app_rate < 0:
                    app_rate = 0
                elif app_rate > 100:
                    app_rate = 100
                summary_str = str(parsed.get("sentiment_summary", "No citizen feedback summary provided.")).strip()

                return json.dumps({
                    "is_satisfied": is_sat,
                    "approval_rating": app_rate,
                    "sentiment_summary": summary_str[:1000]
                })
            except Exception as e:
                return json.dumps({
                    "error": f"JSON_PARSE_FAILED: {str(e)}",
                    "is_satisfied": False,
                    "approval_rating": 0,
                    "sentiment_summary": f"AI response was not valid JSON: {cleaned}"
                })

        def validator_fn(leader_result: str) -> bool:
            """
            Semantic Validator: Core Consensus on 'is_satisfied'.
            Different nodes will generate slightly different summaries or ratings.
            Consensus is reached as long as the nodes agree on the boolean outcome.
            """
            try:
                leader_data = json.loads(leader_result)
            except Exception:
                return False

            # If leader reported an error, validator checks if it also sees an error
            if "error" in leader_data:
                allowed_errors = {"FORUM_SCRAPE_FAILED", "EMPTY_DISCUSSION", "LLM_EXECUTION_FAILED", "JSON_PARSE_FAILED"}
                return any(err in str(leader_data.get("error", "")) for err in allowed_errors)

            validator_raw = leader_fn()
            try:
                validator_data = json.loads(validator_raw)
            except Exception:
                return True  # Abstain on local error

            if "error" in validator_data:
                return True

            leader_satisfied = bool(leader_data.get("is_satisfied", False))
            validator_satisfied = bool(validator_data.get("is_satisfied", False))

            return leader_satisfied == validator_satisfied

        # Run non-deterministic consensus
        consensus_json = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        try:
            res = json.loads(consensus_json)
        except Exception:
            self.project_status[project_id] = "FAILED"
            self.project_sentiment_summary[project_id] = "Consensus outcome was unparseable."
            return

        if "error" in res:
            self.project_status[project_id] = "FAILED"
            self.project_sentiment_summary[project_id] = f"Audit failed: {res.get('error')}. Info: {res.get('sentiment_summary')}"
            return

        is_sat = bool(res.get("is_satisfied", False))
        app_rate = int(res.get("approval_rating", 0))
        summary_str = str(res.get("sentiment_summary", "AI sentiment audit completed."))

        self.project_is_satisfied[project_id] = is_sat
        self.project_approval_rating[project_id] = app_rate
        self.project_sentiment_summary[project_id] = summary_str

        if is_sat:
            # Community is satisfied! Release funds to contractor
            self.project_amount[project_id] = 0
            self.project_status[project_id] = "APPROVED"

            contractor_contract = gl.get_contract_at(contractor)
            contractor_contract.emit_transfer(value=u256(amount))
        else:
            # Community is not satisfied. Funds remain locked.
            self.project_status[project_id] = "ACTIVE"

    # ═══════════════════════════════════════════════════════════════════
    # READ-ONLY VIEW METHODS
    # ═══════════════════════════════════════════════════════════════════
    @gl.public.view
    def get_project(self, project_id: int) -> str:
        """
        Returns JSON details of a specific project.
        """
        if project_id < 0 or project_id >= int(self.projects_count):
            return "{}"

        creator = self.project_creator.get(project_id, Address("0x0000000000000000000000000000000000000000"))
        contractor = self.project_contractor.get(project_id, Address("0x0000000000000000000000000000000000000000"))
        amount = int(self.project_amount.get(project_id, 0))
        scope = self.project_scope.get(project_id, "")
        forum_url = self.project_forum_url.get(project_id, "")
        status = self.project_status.get(project_id, "ACTIVE")
        is_sat = bool(self.project_is_satisfied.get(project_id, False))
        app_rate = int(self.project_approval_rating.get(project_id, 0))
        summary = self.project_sentiment_summary.get(project_id, "")

        return json.dumps({
            "id": project_id,
            "creator": str(creator),
            "contractor": str(contractor),
            "amount": amount,
            "scope": scope,
            "forum_url": forum_url,
            "status": status,
            "is_satisfied": is_sat,
            "approval_rating": app_rate,
            "sentiment_summary": summary
        })

    @gl.public.view
    def get_projects_count(self) -> int:
        return int(self.projects_count)

"""
Output Parser Service
Parses and validates agent outputs, converting them to structured JSON
"""
import json
import re
import logging
from typing import Optional, Dict, Any
from pydantic import ValidationError

from app.schemas.agent_outputs import (
    EpicVision,
    SprintPlan,
    TechnicalDesign,
    CodeImplementation,
    TestSuite,
    ExecutiveSummary,
    StructuredAgentOutput
)

logger = logging.getLogger(__name__)


class OutputParserService:
    """Service to parse and validate agent outputs"""
    
    # Meta-commentary patterns to strip
    META_PATTERNS = [
        r"^.*?It looks like.*?(\{)",  # "It looks like..." before JSON
        r"^.*?Per your instruction.*?(\{)",  # "Per your instruction..." before JSON
        r"^.*?I will.*?(\{)",  # "I will..." before JSON
        r"^.*?Based on.*?(\{)",  # "Based on..." before JSON
        r"^.*?Let me.*?(\{)",  # "Let me..." before JSON
        r"(\}).*$",  # Any text after closing brace
    ]
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def sanitize_json_response(self, raw_output: str) -> str:
        """
        Remove meta-commentary and extract JSON from agent response.
        
        Args:
            raw_output: Raw agent output potentially containing commentary
        
        Returns:
            Cleaned JSON string
        """
        # Remove markdown code blocks if present
        cleaned = re.sub(r'```json\s*', '', raw_output)
        cleaned = re.sub(r'```\s*', '', cleaned)
        
        # Try to extract JSON between first { and last }
        first_brace = cleaned.find('{')
        last_brace = cleaned.rfind('}')
        
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            json_str = cleaned[first_brace:last_brace + 1]
            return json_str.strip()
        
        # If no braces found, return original (will fail validation)
        return cleaned.strip()
    
    def parse_epic_vision(self, raw_output: str) -> Optional[EpicVision]:
        """
        Parse Product Owner output into EpicVision schema.
        
        Args:
            raw_output: Raw agent output
        
        Returns:
            Validated EpicVision object or None if parsing fails
        """
        try:
            # Sanitize and extract JSON
            json_str = self.sanitize_json_response(raw_output)
            data = json.loads(json_str)
            
            # Validate against schema
            epic_vision = EpicVision(**data)
            
            self.logger.info(f"Successfully parsed EpicVision with {len(epic_vision.user_stories)} user stories")
            return epic_vision
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON from PO output: {e}")
            self.logger.debug(f"Raw output: {raw_output[:500]}...")
            return None
        except ValidationError as e:
            self.logger.error(f"EpicVision validation failed: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Unexpected error parsing EpicVision: {e}")
            return None
    
    def parse_sprint_plan(self, raw_output: str) -> Optional[SprintPlan]:
        """Parse Scrum Master output into SprintPlan schema."""
        try:
            json_str = self.sanitize_json_response(raw_output)
            data = json.loads(json_str)
            sprint_plan = SprintPlan(**data)
            
            self.logger.info(f"Successfully parsed SprintPlan with {len(sprint_plan.tasks)} tasks")
            return sprint_plan
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON from SM output: {e}")
            return None
        except ValidationError as e:
            self.logger.error(f"SprintPlan validation failed: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Unexpected error parsing SprintPlan: {e}")
            return None
    
    def parse_technical_design(self, raw_output: str) -> Optional[TechnicalDesign]:
        """Parse Tech Lead output into TechnicalDesign schema."""
        try:
            json_str = self.sanitize_json_response(raw_output)
            data = json.loads(json_str)
            technical_design = TechnicalDesign(**data)
            
            self.logger.info(f"Successfully parsed TechnicalDesign with {len(technical_design.api_endpoints)} endpoints")
            return technical_design
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON from Tech Lead output: {e}")
            return None
        except ValidationError as e:
            self.logger.error(f"TechnicalDesign validation failed: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Unexpected error parsing TechnicalDesign: {e}")
            return None
    
    def parse_code_implementation(self, raw_output: str) -> Optional[CodeImplementation]:
        """Parse Developer output into CodeImplementation schema."""
        try:
            json_str = self.sanitize_json_response(raw_output)
            data = json.loads(json_str)
            code_implementation = CodeImplementation(**data)
            
            self.logger.info(f"Successfully parsed CodeImplementation with {len(code_implementation.code_files)} code files")
            return code_implementation
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON from Developer output: {e}")
            return None
        except ValidationError as e:
            self.logger.error(f"CodeImplementation validation failed: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Unexpected error parsing CodeImplementation: {e}")
            return None
    
    def parse_test_suite(self, raw_output: str) -> Optional[TestSuite]:
        """Parse QA Engineer output into TestSuite schema."""
        try:
            json_str = self.sanitize_json_response(raw_output)
            data = json.loads(json_str)
            test_suite = TestSuite(**data)
            
            self.logger.info(f"Successfully parsed TestSuite with {len(test_suite.test_cases)} test cases")
            return test_suite
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON from QA output: {e}")
            return None
        except ValidationError as e:
            self.logger.error(f"TestSuite validation failed: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Unexpected error parsing TestSuite: {e}")
            return None
    
    def parse_executive_summary(self, raw_output: str) -> Optional[ExecutiveSummary]:
        """Parse Release Manager output into ExecutiveSummary schema."""
        try:
            json_str = self.sanitize_json_response(raw_output)
            data = json.loads(json_str)
            executive_summary = ExecutiveSummary(**data)
            
            self.logger.info("Successfully parsed ExecutiveSummary")
            return executive_summary
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON from summary output: {e}")
            return None
        except ValidationError as e:
            self.logger.error(f"ExecutiveSummary validation failed: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Unexpected error parsing ExecutiveSummary: {e}")
            return None
    
    def parse_session_outputs(self, session_id: str, artifacts: Dict[str, str], 
                             context: Dict[str, Any]) -> StructuredAgentOutput:
        """
        Parse all agent outputs for a session into structured format.
        
        Args:
            session_id: Session identifier
            artifacts: Dictionary mapping agent output filenames to their content
            context: User-provided context
        
        Returns:
            StructuredAgentOutput with all parsed data
        """
        structured_output = StructuredAgentOutput(
            session_id=session_id,
            context=context
        )
        
        # Parse each agent output
        for filename, content in artifacts.items():
            if 'po_vision' in filename or 'vision_userstories' in filename:
                structured_output.epic_vision = self.parse_epic_vision(content)
            elif 'scrum_plan' in filename or 'plan_breakdown' in filename:
                structured_output.sprint_plan = self.parse_sprint_plan(content)
            elif 'dev_' in filename or 'technical_design' in filename:
                structured_output.technical_design = self.parse_technical_design(content)
            elif 'qa_' in filename or 'test_suite' in filename:
                structured_output.test_suite = self.parse_test_suite(content)
            elif 'summary' in filename or 'release' in filename:
                structured_output.executive_summary = self.parse_executive_summary(content)
        
        return structured_output
    
    def validate_for_jira(self, user_stories: list) -> Dict[str, Any]:
        """
        Validate user stories for Jira compatibility.
        
        Returns:
            Dictionary with validation results
        """
        results = []
        
        for story in user_stories:
            validation = {
                "story_id": story.id,
                "status": "valid",
                "checks": {
                    "jira_compatible": True,
                    "title_length": "ok",
                    "has_priority": True,
                    "has_story_points": True,
                    "has_acceptance_criteria": True
                },
                "issues": []
            }
            
            # Check title length (Jira limit: 255 chars)
            if len(story.title) > 255:
                validation["checks"]["title_length"] = "error"
                validation["checks"]["jira_compatible"] = False
                validation["issues"].append(f"Title exceeds Jira limit: {len(story.title)}/255 characters")
                validation["status"] = "error"
            
            # Check required fields
            if not story.priority:
                validation["checks"]["has_priority"] = False
                validation["issues"].append("Missing priority field")
                validation["status"] = "warning"
            
            if not story.story_points:
                validation["checks"]["has_story_points"] = False
                validation["issues"].append("Missing story points")
                validation["status"] = "warning"
            
            if not story.acceptance_criteria:
                validation["checks"]["has_acceptance_criteria"] = False
                validation["issues"].append("Missing acceptance criteria")
                validation["status"] = "warning"
            
            results.append(validation)
        
        # Calculate overall readiness
        total = len(results)
        valid = sum(1 for r in results if r["status"] == "valid")
        warnings = sum(1 for r in results if r["status"] == "warning")
        errors = sum(1 for r in results if r["status"] == "error")
        
        readiness_percentage = (valid / total * 100) if total > 0 else 0
        
        return {
            "validations": results,
            "summary": {
                "total": total,
                "valid": valid,
                "warnings": warnings,
                "errors": errors,
                "readiness_percentage": readiness_percentage
            }
        }


# Singleton instance
_output_parser_service = None

def get_output_parser_service() -> OutputParserService:
    """Get output parser service instance"""
    global _output_parser_service
    if _output_parser_service is None:
        _output_parser_service = OutputParserService()
    return _output_parser_service

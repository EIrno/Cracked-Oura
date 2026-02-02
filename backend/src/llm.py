import json
from typing import List, Dict, Any
from langchain_ollama import ChatOllama
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from langchain_core.callbacks import StreamingStdOutCallbackHandler
from backend.src.config import config_manager
import os
import os

class DataAnalyst:
    def __init__(self):
        cfg = config_manager.get_config()
        
        # 1. Initialize LLM
        self.llm = ChatOllama(
            base_url=cfg.get("llm_host", "http://localhost:11434"),
            model=cfg.get("llm_model", "llama3.1"),
            temperature=0,
            streaming=True,
            callbacks=[StreamingStdOutCallbackHandler()]
        )
        
        # 2. Initialize Database
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        db_path = os.path.join(base_dir, "oura_database.db")
        self.db = SQLDatabase.from_uri(f"sqlite:///{db_path}")

        # 3. Initialize Tools
        # Safe Subclass to prevent hallucinations
        # 3. Initialize Tools
        # Python tools removed by user request
        self.python_tool = None
        
        # 4. System Prompt
        from datetime import date
        today = date.today().strftime("%Y-%m-%d")
        
        self.system_message = f"""You are an expert Oura Ring Data Analyst.
You have access to a SQLite database with tables: sleep, activity, readiness, resilience, sleep_session, etc.

CRITICAL RULES:
1. **SQLite Only**: Use `strftime('%Y-%m-%d', day)` for dates.
2. **Ambiguous Columns**: ALWAYS use table prefixes (e.g., `sleep.score`, `activity.steps`).
3. **Data Truth**: Trust the data. If it says 0, it is 0.
4. **Date Handling**: Today is {today}.
5. **No Hallucination**: Do not output 'Action:' and 'Final Answer:' in the same response.


FORMAT INSTRUCTIONS:
Question: input question
Thought: thought
Action: [sql_db_query, sql_db_schema, sql_db_list_tables, sql_db_query_checker]
Action Input: input
Observation: result
...
Final Answer: answer
"""

    def chat(self, history: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Invokes the LangChain SQL Agent.
        """
        user_query = history[-1]["content"] if history else ""
        thoughts = []
        
        try:
            agent_executor = create_sql_agent(
                llm=self.llm,
                db=self.db,
                extra_tools=[],
                agent_type="zero-shot-react-description",
                verbose=True,
                prefix=self.system_message,
                agent_executor_kwargs={"handle_parsing_errors": True}
            )
        
            response = agent_executor.invoke(
                {"input": user_query},
                return_only_outputs=False,
            )
            
            # Parse Intermediate Steps
            steps = response.get("intermediate_steps", [])
            for i, (action, observation) in enumerate(steps):
                thoughts.append({
                    "step": i * 2 + 1,
                    "type": "tool_call",
                    "tool": action.tool,
                    "params": action.tool_input,
                    "content": action.log 
                })
                thoughts.append({
                    "step": i * 2 + 2,
                    "type": "tool_result",
                    "content": str(observation)
                })
            
            final_answer = response.get("output", "I couldn't generate an answer.")
            
            return {
                "response": final_answer,
                "thoughts": thoughts
            }
            
        except Exception as e:
            print(f"Agent Error: {e}")
            return {
                "response": f"I encountered an error: {str(e)}",
                "thoughts": thoughts + [{"step": 99, "type": "error", "content": str(e)}]
            }

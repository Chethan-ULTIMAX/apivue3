import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTicketsTool from "./tools/list-tickets";
import getTicketTool from "./tools/get-ticket";
import createTicketTool from "./tools/create-ticket";
import updateTicketStatusTool from "./tools/update-ticket-status";
import listEpicsTool from "./tools/list-epics";
import listSprintsTool from "./tools/list-sprints";
import sprintSummaryTool from "./tools/sprint-summary";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "sprint-companion-lovable-template",
  title: "Sprint Companion - Lovable Template",
  version: "0.1.0",
  instructions:
    "Tools for the sprint board: browse epics, sprints and tickets, read a ticket in full, create tickets in the backlog, move tickets between statuses, and summarise sprint progress. All calls act as the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listEpicsTool,
    listSprintsTool,
    listTicketsTool,
    getTicketTool,
    createTicketTool,
    updateTicketStatusTool,
    sprintSummaryTool,
  ],
});

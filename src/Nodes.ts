
import ApiCall from "@nanoservice-ts/api-call";
import IfElse from "@nanoservice-ts/if-else";
import type { NodeBase } from "@nanoservice-ts/shared";
import ExampleNodes from "./nodes/examples";
import AuthNodes from "./nodes/auth";
import UserProfileNodes from "./nodes/user-profile";
import WorkflowCrudNodes from "./nodes/workflow-crud";
import CommunityNodes from "./nodes/community";
import AiNodes from "./nodes/ai";

const nodes: {
	[key: string]: NodeBase;
} = {
	"@nanoservice-ts/api-call": new ApiCall(),
	"@nanoservice-ts/if-else": new IfElse(),
	...ExampleNodes,
	...AuthNodes,
	...UserProfileNodes,
	...WorkflowCrudNodes,
	...CommunityNodes,
	...AiNodes,
};

export default nodes;

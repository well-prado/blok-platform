import AiWorkflowGenerator from './AiWorkflowGenerator';
import AiChatHandler from './AiChatHandler';
import AiSemanticSearch from './AiSemanticSearch';

const AiNodes = {
	"ai-workflow-generator": new AiWorkflowGenerator(),
	"ai-chat-handler": new AiChatHandler(),
	"ai-semantic-search": new AiSemanticSearch(),
};

export default AiNodes; 
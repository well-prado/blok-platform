# Frontend Implementation Specifications

## Component Architecture and Implementation Details

### Core Component Library Structure

The frontend implementation will build upon the existing atomic-canvas architecture while extending it with community platform-specific components. The component library will follow atomic design principles with a clear hierarchy from basic atoms to complex organisms that represent complete feature areas.

**Atomic Components (Atoms)**
- Button variants (primary, secondary, ghost, danger) with loading states and icon support
- Input fields (text, email, password, search) with validation and error states  
- Typography components (headings, body text, code, captions) with theme support
- Icon components with consistent sizing and color inheritance
- Badge components for categories, status indicators, and notifications
- Avatar components with fallback states and online indicators

**Molecular Components (Molecules)**
- Search bar with autocomplete and filter integration
- User profile cards with reputation and verification indicators
- Workflow/node cards with preview, actions, and metadata display
- Navigation breadcrumbs with dynamic path generation
- Rating and voting components with interactive states
- Tag/category selectors with multi-select capabilities

**Organism Components (Organisms)**
- Header navigation with user menu and search integration
- Sidebar navigation with collapsible sections and active states
- Workflow grid with infinite scroll and filtering
- AI chat interface with message history and typing indicators
- Workflow detail layout with sidebar and main content areas
- User profile layout with tabs and content sections

### State Management Architecture

**Zustand Store Structure**
```typescript
// User Store
interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  preferences: UserPreferences;
  reputation: ReputationData;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
}

// Workflow Store  
interface WorkflowStore {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  filters: WorkflowFilters;
  searchQuery: string;
  isLoading: boolean;
  fetchWorkflows: (params: FetchParams) => Promise<void>;
  setCurrentWorkflow: (workflow: Workflow) => void;
  updateFilters: (filters: Partial<WorkflowFilters>) => void;
}

// AI Chat Store
interface AIChatStore {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isGenerating: boolean;
  generatedWorkflow: Workflow | null;
  sendMessage: (message: string) => Promise<void>;
  startNewConversation: () => void;
  applyGeneratedWorkflow: () => void;
}
```

**React Query Integration**
```typescript
// Custom hooks for data fetching
export const useWorkflows = (filters: WorkflowFilters) => {
  return useQuery({
    queryKey: ['workflows', filters],
    queryFn: () => workflowAPI.getWorkflows(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useWorkflowDetail = (id: string) => {
  return useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowAPI.getWorkflow(id),
    enabled: !!id,
  });
};

export const useCreateWorkflow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workflowAPI.createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
    },
  });
};
```

### Routing and Navigation Implementation

**React Router Configuration**
```typescript
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "workflows",
        element: <WorkflowsLayout />,
        children: [
          {
            index: true,
            element: <WorkflowBrowser />,
          },
          {
            path: ":id",
            element: <WorkflowDetail />,
          },
          {
            path: "create",
            element: <WorkflowCreator />,
          },
        ],
      },
      {
        path: "nodes",
        element: <NodesLayout />,
        children: [
          {
            index: true,
            element: <NodeBrowser />,
          },
          {
            path: ":id",
            element: <NodeDetail />,
          },
        ],
      },
      {
        path: "ai",
        element: <AIPlayground />,
      },
      {
        path: "profile/:username",
        element: <UserProfile />,
      },
    ],
  },
]);
```

**Navigation State Management**
```typescript
interface NavigationStore {
  currentPath: string;
  breadcrumbs: Breadcrumb[];
  sidebarCollapsed: boolean;
  searchHistory: string[];
  updatePath: (path: string) => void;
  toggleSidebar: () => void;
  addSearchTerm: (term: string) => void;
}
```

### Atomic Canvas Integration

**Workflow Visualization Component**
```typescript
interface WorkflowCanvasProps {
  workflow: Workflow;
  readonly?: boolean;
  onNodeClick?: (node: WorkflowNode) => void;
  onConnectionChange?: (connections: Connection[]) => void;
  className?: string;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflow,
  readonly = true,
  onNodeClick,
  onConnectionChange,
  className,
}) => {
  const [nodes, setNodes] = useState(workflow.nodes);
  const [edges, setEdges] = useState(workflow.edges);
  
  const nodeTypes = useMemo(() => ({
    trigger: TriggerNode,
    action: ActionNode,
    condition: ConditionNode,
    transform: TransformNode,
  }), []);

  return (
    <div className={cn("h-full w-full", className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={readonly ? undefined : setNodes}
        onEdgesChange={readonly ? undefined : setEdges}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        {!readonly && <MiniMap />}
      </ReactFlow>
    </div>
  );
};
```

**Node Component Implementation**
```typescript
interface CustomNodeProps {
  data: NodeData;
  selected: boolean;
}

export const ActionNode: React.FC<CustomNodeProps> = ({ data, selected }) => {
  return (
    <div className={cn(
      "px-4 py-2 shadow-md rounded-md bg-white border-2",
      selected ? "border-blue-500" : "border-gray-200"
    )}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
          {data.icon}
        </div>
        <div>
          <div className="text-sm font-medium">{data.label}</div>
          <div className="text-xs text-gray-500">{data.description}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
```

### AI Chat Interface Implementation

**Chat Component Architecture**
```typescript
interface AIChatProps {
  conversationId?: string;
  context?: WorkflowContext;
  onWorkflowGenerated?: (workflow: Workflow) => void;
}

export const AIChat: React.FC<AIChatProps> = ({
  conversationId,
  context,
  onWorkflowGenerated,
}) => {
  const { conversation, sendMessage, isLoading } = useAIChat(conversationId);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    await sendMessage(input);
    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation?.messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the workflow you want to create..."
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
```

**Message Component with Workflow Preview**
```typescript
interface ChatMessageProps {
  message: ChatMessage;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  if (message.type === "workflow_generation") {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">{message.content}</p>
        </div>
        {message.generatedWorkflow && (
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Generated Workflow</h4>
            <div className="h-64">
              <WorkflowCanvas 
                workflow={message.generatedWorkflow}
                readonly
              />
            </div>
            <div className="mt-4 flex space-x-2">
              <Button size="sm">Use This Workflow</Button>
              <Button size="sm" variant="outline">Modify</Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex",
      message.sender === "user" ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
        message.sender === "user" 
          ? "bg-blue-500 text-white" 
          : "bg-gray-100 text-gray-900"
      )}>
        <p className="text-sm">{message.content}</p>
        <p className="text-xs opacity-75 mt-1">
          {format(message.timestamp, "HH:mm")}
        </p>
      </div>
    </div>
  );
};
```

### Responsive Design Implementation

**Breakpoint System**
```typescript
export const breakpoints = {
  sm: "640px",
  md: "768px", 
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<keyof typeof breakpoints>("lg");
  
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint("sm");
      else if (width < 768) setBreakpoint("md");
      else if (width < 1024) setBreakpoint("lg");
      else if (width < 1280) setBreakpoint("xl");
      else setBreakpoint("2xl");
    };
    
    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);
  
  return breakpoint;
};
```

**Responsive Layout Components**
```typescript
export const ResponsiveLayout: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "sm" || breakpoint === "md";
  
  return (
    <div className="min-h-screen bg-gray-50">
      {isMobile ? (
        <MobileLayout>{children}</MobileLayout>
      ) : (
        <DesktopLayout>{children}</DesktopLayout>
      )}
    </div>
  );
};

const MobileLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col h-screen">
    <MobileHeader />
    <main className="flex-1 overflow-y-auto">{children}</main>
    <MobileNavigation />
  </div>
);

const DesktopLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex h-screen">
    <Sidebar />
    <div className="flex-1 flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  </div>
);
```

### Performance Optimization Strategies

**Code Splitting and Lazy Loading**
```typescript
// Route-based code splitting
const WorkflowBrowser = lazy(() => import("./pages/WorkflowBrowser"));
const WorkflowDetail = lazy(() => import("./pages/WorkflowDetail"));
const AIPlayground = lazy(() => import("./pages/AIPlayground"));

// Component-based code splitting
const WorkflowCanvas = lazy(() => import("./components/WorkflowCanvas"));

// Lazy loading with suspense
export const App: React.FC = () => (
  <Router>
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/workflows" element={<WorkflowBrowser />} />
        <Route path="/workflows/:id" element={<WorkflowDetail />} />
        <Route path="/ai" element={<AIPlayground />} />
      </Routes>
    </Suspense>
  </Router>
);
```

**Memoization and Optimization**
```typescript
// Memoized workflow card component
export const WorkflowCard = memo<WorkflowCardProps>(({ workflow, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect(workflow.id);
  }, [workflow.id, onSelect]);

  return (
    <div 
      className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <h3 className="font-medium">{workflow.title}</h3>
      <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
      <div className="flex items-center justify-between mt-4">
        <UserAvatar user={workflow.author} size="sm" />
        <div className="flex items-center space-x-2">
          <StarIcon className="w-4 h-4" />
          <span className="text-sm">{workflow.rating}</span>
        </div>
      </div>
    </div>
  );
});

// Virtualized list for large datasets
export const WorkflowList: React.FC<{ workflows: Workflow[] }> = ({ 
  workflows 
}) => {
  const rowRenderer = useCallback(({ index, key, style }) => (
    <div key={key} style={style}>
      <WorkflowCard workflow={workflows[index]} />
    </div>
  ), [workflows]);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          width={width}
          rowCount={workflows.length}
          rowHeight={200}
          rowRenderer={rowRenderer}
        />
      )}
    </AutoSizer>
  );
};
```

### Testing Strategy and Implementation

**Component Testing with React Testing Library**
```typescript
describe("WorkflowCard", () => {
  const mockWorkflow: Workflow = {
    id: "1",
    title: "Test Workflow",
    description: "A test workflow",
    author: { id: "1", name: "Test User" },
    rating: 4.5,
  };

  it("renders workflow information correctly", () => {
    render(<WorkflowCard workflow={mockWorkflow} onSelect={jest.fn()} />);
    
    expect(screen.getByText("Test Workflow")).toBeInTheDocument();
    expect(screen.getByText("A test workflow")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("calls onSelect when clicked", () => {
    const onSelect = jest.fn();
    render(<WorkflowCard workflow={mockWorkflow} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith("1");
  });
});
```

**Integration Testing for AI Chat**
```typescript
describe("AIChat Integration", () => {
  beforeEach(() => {
    server.use(
      rest.post("/api/ai/chat", (req, res, ctx) => {
        return res(ctx.json({
          message: "I'll help you create that workflow",
          generatedWorkflow: mockGeneratedWorkflow,
        }));
      })
    );
  });

  it("generates workflow from user message", async () => {
    render(<AIChat />);
    
    const input = screen.getByPlaceholderText(/describe the workflow/i);
    const sendButton = screen.getByText("Send");
    
    fireEvent.change(input, { 
      target: { value: "Create a workflow that processes CSV files" } 
    });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText("Generated Workflow")).toBeInTheDocument();
    });
  });
});
```

This comprehensive frontend implementation specification provides detailed guidance for building a modern, performant, and maintainable React application that integrates seamlessly with the atomic-canvas system while providing innovative AI-powered features for the Blok community platform.


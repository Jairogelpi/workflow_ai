# UX Performance Architecture: "The Zero-Friction Standard"

> **Goal**: 60fps interaction even with heavy AI background load.

## 1. The "Transient Update" Pattern
Implemented in `src/components/graph/GraphCanvas.tsx`.

### The Problem
When the Swarm (Background) updates the graph state via Zustand/Supabase, a naive `useEffect` would overwrite the local local React Flow state. If the user is dragging a node, this causes the node to "snap back" or stutter.

### The Solution: Smart Merging
We use a **Local-Is-King** merge strategy inside the React Flow sync effect:

```typescript
setNodes((localNodes) => {
    // Map existing local nodes for O(1) lookup
    const localMap = new Map(localNodes.map(n => [n.id, n]));
    
    return serverNodes.map(serverNode => {
        const localNode = localMap.get(serverNode.id);
        
        // CRITICAL: If the user is touching it, IGNORE the server
        if (localNode && (localNode.dragging || localNode.selected)) {
            return {
                ...serverNode,
                position: localNode.position, // Keep local position
                selected: localNode.selected,
                dragging: localNode.dragging
            };
        }
        return serverNode; // Otherwise, accept server truth
    });
});
```

## 2. Antigravity Physics (Web Worker)
Physics calculations (Coulomb Repulsion) are offloaded to `physics.worker.ts`.
- **Bridge**: `useAntigravityEngine.ts` sends node positions to Worker.
- **Update**: Worker calculates forces and posts back new positions.
- **Render**: The Hook updates React Flow state directly (bypassing Zustand) for smoothness.

## 3. Optimistic UI
- **Instant Feedback**: When you link nodes, the edge appears instantly. The backend sync happens asynchronously.
- **Stale-While-Revalidate**: We show cached data immediately while `SyncService` fetches fresh vectors.

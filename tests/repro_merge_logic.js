/**
 * Standalone Simulation of MergeEngine logic
 * Verifies core algorithms without mocking complexity.
 */

const sourceNodes = [{ id: 'n1', content: { val: 'new' }, metadata: { pin: false } }];
const targetNodes = [{ id: 'n1', content: { val: 'old' }, metadata: { pin: true } }];

function detectEditConflicts(source, target) {
    const conflicts = [];
    for (const sn of source) {
        const tn = target.find(n => n.id === sn.id);
        if (tn) {
            if (JSON.stringify(sn.content) !== JSON.stringify(tn.content)) {
                conflicts.push({ nodeId: sn.id, reason: 'Concurrent modification detected' });
            }
        }
    }
    return conflicts;
}

function simulateMerge(source, target) {
    const merged = [...target];
    for (const sn of source) {
        const index = merged.findIndex(n => n.id === sn.id);
        if (index > -1) {
            merged[index] = sn;
        } else {
            merged.push(sn);
        }
    }
    return merged;
}

const conflicts = detectEditConflicts(sourceNodes, targetNodes);
const mergedNodes = simulateMerge(sourceNodes, targetNodes);
const brokenInvariants = [];

for (const node of mergedNodes) {
    const targetNode = targetNodes.find(tn => tn.id === node.id);
    if (targetNode && targetNode.metadata.pin) {
        if (JSON.stringify(targetNode.content) !== JSON.stringify(node.content)) {
            brokenInvariants.push({
                nodeId: node.id,
                reason: 'Target node is PINNED (Immutable Invariant)'
            });
        }
    }
}

console.log('SIMULATION RESULTS:');
console.log('Conflicts:', JSON.stringify(conflicts, null, 2));
console.log('Broken Invariants:', JSON.stringify(brokenInvariants, null, 2));

if (conflicts.length > 0 && brokenInvariants.length > 0) {
    console.log('✅ Logic correctly identified both physical and semantic issues.');
} else {
    console.error('❌ Logic failed to identify issues.');
    process.exit(1);
}

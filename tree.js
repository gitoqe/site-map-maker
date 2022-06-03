/**
 * Simple class for single node in a tree
 */
class TreeNode {
    /**
     * TreeNode constructor
     * @param {*} key 
     * @param {*} value 
     * @param {*} parent 
     */
    constructor (key, value = key, parent = null) {
        this.key = key;
        this.value = value;
        this.parent = parent;
        this.children = [];
    }

    /**
     * Is this node a leaf
     */
    get isLeaf() {
        return this.children.length === 0;
    }

    /**
     * Is this node has children
     */
    get hasChildren() {
        return !this.isLeaf();
    }
}

/**
 * Simple Tree class using TreeNode class
 */
class Tree {
    /**
     * Tree constructor
     * @param {*} key 
     * @param {*} value 
     */
    constructor(key, value = key) {
        this.root = new TreeNode(key, value);
    }

    /**
     * 
     * @param {*} node 
     */
    *preOrderBypass(node = this.root) {
        yield node;
        if (node.children.length) {
            for (const child of node.children) {
                yield* this.preOrderBypass(child);
            }
        }
    }

    /**
     * Traverses the tree by recursively traversing each node's children followed by the node
     * @param {*} node 
     */
    *postOrderBypass(node = this.root) {
        if (node.children.length) {
            for (const child of node.children) {
                yield* this.postOrderBypass(child);
            }
        }
        yield node;
    }
        

    /**
     * 
     * @param {*} parentNodeKey
     * @param {*} key 
     * @param {*} value 
     * @return {bool}
     */
    insert(parentNodeKey, key, value = key) {
        for (const node of this.preOrderBypass()) {
            if (node.key === parentNodeKey) {
                node.children.push(new TreeNode(key, value, node));
                return true;
            }
        }
        return false;
    }

    /**
     * 
     * @param {*} key 
     * @return {*}
     */
    remove(key) {
        for (const node of this.preOrderBypass()) {
            const filtered = node.children.filter(c => c.key !== key);
            if (filtered.length !== node.children.length) {
                node.children = filtered;
                return true;
            }
        }
        return false;
    }
    
    /**
     * 
     * @param {*} key 
     * @return {*} 
     */
    find(key) {
        for (const node of this.preOrderBypass()) {
            if (node.key === key) return node;
        }
        return undefined;
    }
}

module.exports = {
    Tree, TreeNode
}

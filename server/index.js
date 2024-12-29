import * as alt from 'alt-server';

const TREE_POSITIONS = [
    { x: -713.7098999023438, y: 5401.39794921875, z: 52.3809814453125 },
    { x: -735.3626098632812, y: 5406.72509765625, z: 49.179443359375 },
    { x: -716.3208618164062, y: 5405.53857421875, z: 51.5047607421875 },
];

const REWARD_PER_TREE = 150;
const EXPERIENCE_PER_TREE = 10;

class WoodcutterJob {
    constructor() {
        this.trees = new Map();
        this.playerProgress = new Map();
        
        this.init();
    }

    init() {
        TREE_POSITIONS.forEach((pos, index) => {
            this.trees.set(index, {
                position: pos,
                available: true
            });
        });

        alt.onClient('woodcutter:startCutting', this.handleStartCutting.bind(this));
        alt.onClient('woodcutter:finishMinigame', this.handleFinishMinigame.bind(this));
        alt.onClient('woodcutter:requestTreePositions', this.handleTreePositionsRequest.bind(this));
    }

    handleTreePositionsRequest(player) {
        alt.emitClient(player, 'woodcutter:syncTreePositions', TREE_POSITIONS);
    }

    handleStartCutting(player, treeId) {
        const tree = this.trees.get(treeId);
        if (!tree || !tree.available) {
            alt.emitClient(player, 'woodcutter:notification', 'This tree is not available');
            return;
        }

        alt.emitClient(player, 'woodcutter:startMinigame', treeId);
    }

    handleFinishMinigame(player, treeId, success) {
        if (!success) {
            return;
        }

        const progress = this.playerProgress.get(player.id) || { trees: 0, experience: 0 };
        progress.trees++;
        progress.experience += EXPERIENCE_PER_TREE;
        this.playerProgress.set(player.id, progress);

        const tree = this.trees.get(treeId);
        tree.available = false;
        setTimeout(() => {
            tree.available = true;
        }, 30000);

        player.setSyncedMeta('cash', (player.getSyncedMeta('cash') || 0) + REWARD_PER_TREE);
    }
}

const woodcutterJob = new WoodcutterJob(); 
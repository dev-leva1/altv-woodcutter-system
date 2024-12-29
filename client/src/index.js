import * as alt from 'alt-client';
import * as native from 'natives';

const WOODCUTTER_PED_MODEL = 'a_m_m_hillbilly_01';
const AXE_HASH = alt.hash('prop_w_me_hatchet');

class WoodcutterClient {
    constructor() {
        this.isMinigameActive = false;
        this.currentTree = null;
        this.blips = new Map();
        this.markers = new Map();
        this.jobPed = null;
        this.jobPedPos = { x: -839.90771484375, y: 5402.10986328125, z: 33.6043701171875 };
        this.minigameView = null;
        
        this.init();
        this.initHelpText();
        this.initMinigameView();
    }

    initMinigameView() {
        this.minigameView = new alt.WebView('http://resource/client/src/html/index.html', false);

        this.minigameView.on('load', () => {
            console.log('Minigame WebView loaded');
        });

        this.minigameView.on('woodcutter:showMinigameUI', () => {
            if (this.minigameView) {
                this.minigameView.focus();
                native.displayHud(false);
                native.displayRadar(false);
            }
        });

        this.minigameView.on('woodcutter:hideMinigameUI', () => {
            if (this.minigameView) {
                this.minigameView.unfocus();
                native.displayHud(true);
                native.displayRadar(true);
            }
        });
    }

    async init() {
        await this.loadModel(WOODCUTTER_PED_MODEL);
        
        this.createJobNPC();
        
        alt.onServer('woodcutter:startMinigame', this.startMinigame.bind(this));
        alt.onServer('woodcutter:notification', this.showNotification.bind(this));
        alt.onServer('woodcutter:syncTreePositions', this.handleTreePositions.bind(this));
        
        alt.setInterval(this.renderMarkers.bind(this), 0);
        
        alt.emitServer('woodcutter:requestTreePositions');
    }

    handleTreePositions(positions) {
        this.treePositions = positions;
        if (this.blips.size > 0) {
            this.showTreeBlips();
        }
    }

    initHelpText() {
        alt.everyTick(() => {
            if (!this.jobPed) return;
            
            const playerPos = alt.Player.local.pos;
            const distance = this.getDistance(playerPos, this.jobPedPos);
            
            if (distance <= 3.0) {
                this.showHelpText('Press ~INPUT_CONTEXT~ to talk with the woodcutter');
                
                if (native.isControlJustPressed(0, 38)) {
                    this.showJobDialog();
                }
            }
        });
    }

    getDistance(pos1, pos2) {
        return Math.sqrt(
            Math.pow(pos1.x - pos2.x, 2) +
            Math.pow(pos1.y - pos2.y, 2) +
            Math.pow(pos1.z - pos2.z, 2)
        );
    }

    showHelpText(text) {
        native.beginTextCommandDisplayHelp('STRING');
        native.addTextComponentSubstringPlayerName(text);
        native.endTextCommandDisplayHelp(0, false, true, -1);
    }

    async loadModel(model) {
        const hash = alt.hash(model);
        native.requestModel(hash);
        
        return new Promise((resolve) => {
            const interval = alt.setInterval(() => {
                if (native.hasModelLoaded(hash)) {
                    alt.clearInterval(interval);
                    resolve();
                }
            }, 50);
        });
    }

    createJobNPC() {
        const npcHeading = 330;
        
        this.jobPed = native.createPed(1, alt.hash(WOODCUTTER_PED_MODEL), 
            this.jobPedPos.x, this.jobPedPos.y, this.jobPedPos.z, npcHeading, 
            false, false);
            
        native.taskStartScenarioInPlace(this.jobPed, 'WORLD_HUMAN_CLIPBOARD', 0, true);
        
        native.freezeEntityPosition(this.jobPed, true);
        native.setEntityInvincible(this.jobPed, true);
        native.setBlockingOfNonTemporaryEvents(this.jobPed, true);
        
        const blip = native.addBlipForCoord(this.jobPedPos.x, this.jobPedPos.y, this.jobPedPos.z);
        native.setBlipSprite(blip, 280);
        native.setBlipColour(blip, 25);
        native.setBlipAsShortRange(blip, true);
        native.beginTextCommandSetBlipName('STRING');
        native.addTextComponentSubstringPlayerName('Woodcutter Job');
        native.endTextCommandSetBlipName(blip);
    }

    startMinigame(treeId) {
        if (this.isMinigameActive) return;
        
        this.isMinigameActive = true;
        this.currentTree = treeId;

        native.requestAnimDict("melee@large_wpn@streamed_core");
        
        const waitAnim = alt.setInterval(() => {
            if (native.hasAnimDictLoaded("melee@large_wpn@streamed_core")) {
                alt.clearInterval(waitAnim);
                
                if (this.minigameView) {
                    this.minigameView.focus();
                    native.displayHud(false);
                    native.displayRadar(false);
                    this.minigameView.emit('woodcutter:showMinigameUI');

                    this.startChoppingAnimation();
                    
                    const roundCompleteHandler = (success) => {
                        this.minigameView.off('woodcutter:roundComplete', roundCompleteHandler);
                        this.finishMinigame(success);
                    };
                    
                    this.minigameView.on('woodcutter:roundComplete', roundCompleteHandler);
                }
            }
        }, 5);
    }

    startChoppingAnimation() {
        const playerPed = alt.Player.local.scriptID;
        native.giveWeaponToPed(playerPed, 0x3813FC08, 1, false, true);

        this.choppingInterval = alt.setInterval(() => {
            if (!this.isMinigameActive) {
                alt.clearInterval(this.choppingInterval);
                return;
            }

            native.taskPlayAnim(
                playerPed,
                "melee@large_wpn@streamed_core",
                "ground_attack_on_spot",
                8.0, // blendInSpeed
                -8.0, // blendOutSpeed
                1500, // duration
                1, // flag
                0.0, // playbackRate
                false, // lockX
                false, // lockY
                false // lockZ
            );
        }, 1500);
    }

    finishMinigame(success) {
        if (!this.isMinigameActive) return;
        
        this.isMinigameActive = false;

        if (this.choppingInterval) {
            alt.clearInterval(this.choppingInterval);
        }

        const playerPed = alt.Player.local.scriptID;
        native.removeWeaponFromPed(playerPed, 0x3813FC08);
        native.clearPedTasks(playerPed);
        
        if (success) {
            native.playSound(-1, "Mission_Pass_Notify", "DLC_HEISTS_GENERAL_FRONTEND_SOUNDS", false, 0, false);
            this.showNotification('~g~Excellent!~w~ Tree successfully cut down! You earned ~g~$150~w~!');
            
            const treePos = this.markers.get(this.currentTree);
            if (treePos) {
                native.addExplosion(
                    treePos.x, 
                    treePos.y, 
                    treePos.z,
                    2, 
                    0.0, 
                    false, 
                    false,
                    0.0, 
                    true 
                );

                native.playSound(-1, "Falling_Trees", "FAMILY_5_SOUNDS", false, 0, false);
                
                native.requestNamedPtfxAsset("core");
                native.setParticleFxNonLoopedColour(1.0, 1.0, 1.0);
                native.startParticleFxLoopedAtCoord(
                    "exp_grd_bzgas_smoke",
                    treePos.x,
                    treePos.y,
                    treePos.z,
                    0.0,
                    0.0,
                    0.0,
                    1.0,
                    false,
                    false,
                    false,
                    false
                );
            }
        } else {
            native.playSound(-1, "Failure", "DLC_HEIST_HACKING_SNAKE_SOUNDS", false, 0, false);
            this.showNotification('~r~Failed!~w~ You need to click faster!');
        }
        
        if (this.minigameView) {
            this.minigameView.emit('woodcutter:hideMinigameUI');
            this.minigameView.unfocus();
            native.displayHud(true);
            native.displayRadar(true);
        }
        
        alt.emitServer('woodcutter:finishMinigame', this.currentTree, success);
        
        this.currentTree = null;
    }

    showNotification(message) {
        native.beginTextCommandThefeedPost('STRING');
        native.addTextComponentSubstringPlayerName(message);
        native.endTextCommandThefeedPostTicker(false, true);
    }

    renderMarkers() {
        if (this.isMinigameActive) return;
        
        const playerPos = alt.Player.local.pos;
        
        this.markers.forEach((marker, index) => {
            native.drawMarker(
                1,
                marker.x, marker.y, marker.z - 1.0,
                0, 0, 0,
                0, 0, 0,
                1.0, 1.0, 1.0,
                50, 255, 50, 100,
                false, false, 2,
                false, null, null, false
            );

            const distance = this.getDistance(playerPos, marker);
            if (distance <= 2.0) {
                this.showHelpText('Press ~INPUT_CONTEXT~ to start cutting the tree');
                
                if (native.isControlJustPressed(0, 38)) {
                    alt.emitServer('woodcutter:startCutting', index);
                }
            }
        });
    }

    showJobDialog() {
        this.showNotification('~g~Woodcutter:~w~ Hello! Want to earn some money? I pay $150 for each tree cut down.');
        
        alt.setTimeout(() => {
            this.showNotification('~g~Woodcutter:~w~ Go to any marked tree and start cutting.');
            
            this.showTreeBlips();
        }, 1000);
    }

    showTreeBlips() {
        if (!this.treePositions || this.treePositions.length === 0) {
            console.log('No available tree positions');
            return;
        }

        this.blips.forEach(blip => {
            native.removeBlip(blip);
        });
        this.blips.clear();
        this.markers.clear();

        this.treePositions.forEach((pos, index) => {
            const blip = native.addBlipForCoord(pos.x, pos.y, pos.z);
            native.setBlipSprite(blip, 364);
            native.setBlipColour(blip, 2);
            native.setBlipScale(blip, 0.8);
            native.setBlipAsShortRange(blip, true);
            native.beginTextCommandSetBlipName('STRING');
            native.addTextComponentSubstringPlayerName('Tree for cutting');
            native.endTextCommandSetBlipName(blip);
            
            this.blips.set(index, blip);
            this.markers.set(index, pos);
        });

        const playerPos = alt.Player.local.pos;
        let nearestTree = this.treePositions[0];
        let minDistance = this.getDistance(playerPos, this.treePositions[0]);

        this.treePositions.forEach(pos => {
            const distance = this.getDistance(playerPos, pos);
            if (distance < minDistance) {
                minDistance = distance;
                nearestTree = pos;
            }
        });

        native.setNewWaypoint(nearestTree.x, nearestTree.y);
    }
}

const woodcutterClient = new WoodcutterClient(); 
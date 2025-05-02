var Imported = Imported || {};
Imported.JM_AA3D = true;

var JM = JM || {};
JM.AA3D = JM.AA3D || {};
JM.AA3D.Version = 0.9.1;

/*:
*@plugindesc Compatibility and cross-feature adaptation patch for MV3D V.9.2.7 (by Cutievirus), AlphaABS V.1250[PRO] (by Kage Desu), and QMovement (by Quxios).
*@author JankyMouse | Version: 0.7 (beta)

*@param _useWalkRunSkill
*@text Use automatic 3D actions?
*@parent options
*@desc Play 3D character actions based on move-state and frame position when using a skill/weapon.
*@type boolean
*@on Yes
*@off No
*@default true

*@param _useFreeDir
*@text Skill Aiming behavior
*@parent options
*@desc Change "freeDirection" ABS skill setting (notetags) behavior.
*@type boolean
*@on PlayerFace Aiming
*@off 8 Dir Aiming
*@default true

*@param _useProjectileModel
*@text Projectile Type
*@parent options
*@desc Use 3D Models, 3D animated sprites, or particles for projectiles based on the "img" notetags setting.
*@type select
*@option 3D Model
*@value 1
*@option 3D Sprite
*@value 2
*@option Particle System
*@value 3
*@default 3D Sprite

*@param _usePKDInventory
*@text Using PKD Inventory?
*@parent options
*@desc Using PKD Inventory plugin or built in inventory? Nessesary for mouse lock ignore.
*@type boolean
*@on PKD Inventory Plugin
*@off Built in Inventory
*@default true

*@help
*==[Documentation:]===========================================================
*MV3D - https://cutievirus.com/docs/mv3d/#getting-started
*AlphaABS - https://github.com/KageDesu/Alpha-ABS/wiki
*QMovement - https://quxios.github.io/plugins/QMovement
*
*==[CrossFeatures:]===========================================================
*Automatic 3D actions for ABS Skills and Items:===============================
*Added handling for 3D model actions for all ABS Skills and Items. Game Player
* + Game AI (Use automatic 3D actions) With this enabled, all of your ABS
*skills/items will switch actions based on skills used and movestate
*(for smooth animations/remedies "iceskating" models when using actions while
*moving) Just add 3 actions (NLATracks/With matching frames of the actual skill  
*animation like swinging a sword) to your model per skill/item with the same
*name as your skill or weapon and append 2 of them with walk and run 
*respectively. i.e. Attack, Attackwalk, Attackrun
*
*3D Model/Sprite Projectiles:=================================================
*Added handling for 3D model(Experimental) or 3D sprite projectiles. Just plug
*the name of your projectile model (that goes in your "Models" folder) into
*<img:> skill parameter n your skill/weapon notetags. For models, AA3D will  
*use the first NLA track and loop it. For sprites, AA3D will project a flat  
*sprite into the 3D space and setup is the same as it's originl behavior.
*Append "_frames" to the img name to define the ammount of animation frames. 
*i.e. <img:Attack_3> where 3 means it has 3 frames of animation. The file for 
*sprite mode still needs to go in "Pictures" folder.
*
*(Added Ver 0.9)
*For particles, you can use the particle editor here 
*https://playground.babylonjs.com/#M7MYT8#11 and then save the particle system 
*to a JSON file. Save it to a "particles" folder in the root directory of your 
*game (same place the mv3d folder is). Then, "edit" the associated textures for 
*the particle system so you can save them to the particles folder aswell. Make 
*sure the JSON file and texture has the same name. Finally, define which 
*weapons or skills you want to add the particle projectile with the  notetag 
*in the datebase. Once you get comfortable with the editor, you can open the 
*JSON file to study the formatting to make more advanced custom particle 
*systems.
*
*(Added Ver 0.9)
*Define projectile type with the note tag in the weapons or skills database. 
*(i.e projectile:model, projectile:sprite, or projectile:particle) Weapons and
*skills will default to the value selected in plugin options if not defined 
*with a notetag.
*
*==[Adaptations:]=============================================================
*<freeDirection:1> Skill Notetags have been adapted to use the direction your 
*character is facing (360 degree attacking) or 8 Dir aiming to use 
*freeDirection as a patch for 8 direction attacks. (These are specifically 
*added for use with my UniformCameraPlayerFace extension for MV3D but either
*will work still without it) TODO: Patch original use case (aim skills based
*on Clicking on the map) + be able to use both.
*
*TODO:========================================================================
*Will be adding more mouse modes (Current behavior: Right click
*releases the mouse and left click locks the mouse camera again)
*
*==[Compatibility & Performance:]=============================================
*Pathfinding:
*Integrated OrangePathFinding by Hudell. 
*Nessesary performance and enemy diagonal pathing fix.
*
*Collision Fixes & Z Jumping Bug Fix for QMovement:===========================
*Various collision fixes added for Game Player and Game AI Jumping, Impulse
*Actions (Knockbacks), and complex Impulse Actions (Knockbacks greater than 1).
*
*Player to Event, Player to AI, AI to Event, and AI to AI collision fixes for 
*"Same as Player" priority.
TODO:=========================================================================
*Dancing in place has been fixed but there is still an issue that can cause AI 
*to slip under the player if trying to pass downwards on a slope and get stuck 
*in the AI. Adjusting mv3d:scale() is a decent workaround for now as it adjusts 
*the colliders as well.. Still trying to sort that out as I'm pretty sure 
*there's at least 2 collision systems working on top of eachother to a certain 
*extent still. But ya, basically it's because of the slope. Tilting the tile 
*causes the distance to shorten obviously. Then it thinks it's not colliding 
*yet based on distance but it's already in the middle of the AIs collider by 
*the time the collision check fires.
*/

//--------------------------------------------------------------------------------
// AA3D Plugin Parameters

var JM_AA3D = JM.AA3D;
JM_AA3D.params = PluginManager.parameters("AA3D");

JM_AA3D.params = {
  _useWalkRunSkill: JSON.parse(JM_AA3D.params['_useWalkRunSkill']),
  _useFreeDir: JSON.parse(JM_AA3D.params['_useFreeDir']),
  _useProjectileModel: JSON.parse(JM_AA3D.params['_useProjectileModel']),
  _usePKDInventory: JSON.parse(JM_AA3D.params['_usePKDInventory'])
};


mv3d.Character.prototype.getPlatform = function (x = this.char._realX, y = this.char._realY, opts = {}) {

    return mv3d.getPlatformForCharacter(this, x, y, opts);
  
};



//--------------------------------------------------------------------------------
// GamePad Right Stick Fix TODO: Fix fav weapons circle and freedirection(original)

var _alias_Input__updateGamepadState = Input._updateGamepadState;
Input._updateGamepadState = function(gamepad) {
   _alias_Input__updateGamepadState.apply(this, arguments);
   input_mv3d = window.mv3d;
    const threshold = 0.1;
    const max = 1 - threshold;
    const axes = gamepad.axes;
    if (Math.abs(axes[0]) > threshold) {
      input_mv3d._gamepadStick.left.x += (axes[0] - Math.sign(axes[0]) * threshold) / max;
    }
    if (Math.abs(axes[1]) > threshold) {
      input_mv3d._gamepadStick.left.y -= (axes[1] - Math.sign(axes[1]) * threshold) / max;
    }
    if (Math.abs(axes[2]) > threshold) {
      input_mv3d._gamepadStick.right.x += (axes[2] - Math.sign(axes[2]) * threshold) / max;
    }
    if (Math.abs(axes[3]) > threshold) {
      input_mv3d._gamepadStick.right.y -= (axes[3] - Math.sign(axes[3]) * threshold) / max;
    }
};

//--------------------------------------------------------------------------------
// Inventory Button & Move Cancel Casting

const _Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
    //console.log("Wee")
    _Scene_Map_update.call(this);
  if (Imported.PKD_MapInventory) {
    if(Input.isTriggered ("myOpenInventory")) PKD_MI.openOrCloseInventory(), 
      document.exitPointerLock();
}
    if($gamePlayer.isMoving() && $gamePlayer._checkPlayerIsCasting) $gamePlayer._checkPlayerIsCasting();
};


const _SceneManager_onSceneStart = SceneManager.onSceneStart;
SceneManager.onSceneStart = function() {
    //console.log("Wee")
    _SceneManager_onSceneStart.call(this);
    // Refresh Colliders / fixes AI starting position collisions
    ColliderManager._needsRefresh = true;
    // Set Keybind "B"
    Input.keyMapper["66"] = "myOpenInventory";  // B
};

//--------------------------------------------------------------------------------
// Cursor/PointerLock Fixes

var _Scene_Map_processMapTouch = Scene_Map.prototype.processMapTouch;
Scene_Map.prototype.processMapTouch = function() {
  input_mv3d = window.mv3d;
  if ((TouchInput.isTriggered() && JM_AA3D.params['_usePKDInventory'] && PKD_MI.isProcessEUITouch() === false) || (TouchInput.isTriggered() && !JM_AA3D.params['_usePKDInventory'])) {
    var _Graphics$_canvas$req, _Graphics$_canvas$req2;
    // requestPointerLock isn't returning a promise ????
    (_Graphics$_canvas$req = Graphics._canvas.requestPointerLock()) === null || _Graphics$_canvas$req === void 0 ? void 0 : (_Graphics$_canvas$req2 = _Graphics$_canvas$req.catch) === null || _Graphics$_canvas$req2 === void 0 ? void 0 : _Graphics$_canvas$req2.call(_Graphics$_canvas$req, console.error);
  }
}, () => !input_mv3d.isDisabled() && input_mv3d.inputCameraMouse && !input_mv3d._touchState.isTapped;

  
Scene_Map.prototype.processMapTouchCanceling = function() {
  // Override
}

var SM_isMapTouchOk = Scene_Map.prototype.isMapTouchOk;
Scene_Map.prototype.isMapTouchOk = function() {

  const isOk = SM_isMapTouchOk.apply(this, arguments);
  input_mv3d = window.mv3d;
  if (!isOk || !input_mv3d.inputCameraMouse) {
    if (!document.pointerLockElement && input_mv3d._relockPointer) {var _Graphics$_canvas$req3, _Graphics$_canvas$req4;
      (_Graphics$_canvas$req3 = Graphics._canvas.requestPointerLock()) === null || _Graphics$_canvas$req3 === void 0 ? void 0 : (_Graphics$_canvas$req4 = _Graphics$_canvas$req3.catch) === null || _Graphics$_canvas$req4 === void 0 ? void 0 : _Graphics$_canvas$req4.call(_Graphics$_canvas$req3, console.error);
      input_mv3d._relockPointer = false;
    }
  }
  return isOk;
}, true;

//--------------------------------------------------------------------------------
// Inventory Cell Dragging Fix / No longer requires long press for dragging

let timeoutId;

document.addEventListener('mousemove', function() {
  clearTimeout(timeoutId);
  if (timeoutId = setTimeout(function() {
    //console.log('Mouse movement stopped'),
    JM.AA3D.mouseMove = false;
  }, 70)){
    //console.log('Mouse movement started'),
    JM.AA3D.mouseMove = true;
  };
});

PKD_MI.LIBS.Sprite_MapInvCell.prototype.update = function() {
  var ref;
  KDCore.Sprite.prototype.update.call(this);
  if ((ref = this._checkUsableThread) != null) {
    ref.update();
  }
  if ($gameTemp._pkdMICellMoving === true) {
    return;
  }
  if (TouchInput.isPressed() && this.isHovered()) { // && TouchInput._onMouseMove
    if (this.item == null) {
      return;
    }
    //this._pressTimer++;
    if (JM.AA3D.mouseMove) {
      return this.startMovingCell();
    }
  } else {
    return //this._pressTimer = 0;
  }
}

//--------------------------------------------------------------------------------
// changeEquip: Game_Player Model on Equip Handler

var _Game_Actor_changeEquip = Game_Actor.prototype.changeEquip;
Game_Actor.prototype.changeEquip = function(slotId, item) {
  console.log("changeEquip")
  this._absParams.needWeaponCheck = true;
  _Game_Actor_changeEquip.call(this, slotId, item);
  console.log(item)
  $dataWeapons.forEach(WIndex => {
    if (WIndex != null && WIndex != "null") {
      if (WIndex.note != "") {
        var WN = WIndex.name.toLowerCase().replace(/ /g,"");
        mv3d.scene.getMeshByID(WN).visibility = 0;
      }
    }
  });
//  console.log($gamePlayer._absParams.battler._equips[0]._itemId)
  if (item != null) { //USE TO CHANGE MODEL BASED ON WEAPON!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    
    var itemName = item.name.toLowerCase().replace(/ /g,"");
    console.log(itemName);
    mv3d.scene.getMeshByID(itemName).visibility = 1;
//    $gamePlayer._absParams.battler._absParams.battleSkillsABS._skillsABS[0].projectileNote = item.projectileNote;
  }
  this.aaRefreshAnimaX();
  this._refreshVisualEq();
  this._refreshCanApplyForShieldUIButton();
  if(AA.isABS())
    $gamePlayer._refreshGamePadCommands();
};

//--------------------------------------------------------------------------------
// Game_Player MoveState / Model Action Logic

Game_Player.prototype.MoveStateActions = function(){
console.log($gamePlayer.mv3d_sprite.actions, "MoveStateActions started")
  this._inActionStopped = false;
  this._inActionMoving = false;
  this._inActionRunning = false;
  const commandName = "@p action play";

  if(this.isMoving() && this.isDashing()){
    mv3d.command(commandName,JM.AA3D.actionName + "Run"); //Run
    this._inActionRunning = true;
    console.log("Run");
    return;
  }
  if(this.isMoving() && !this.isDashing()){
    mv3d.command(commandName,JM.AA3D.actionName + "Walk"); //Walk
    this._inActionMoving = true;
    console.log("Walk");
    return;
  }
  if(!this.isMoving()){
    mv3d.command(commandName,JM.AA3D.actionName);
    this._inActionStopped = true;
    console.log("Stop");
    return;
  }
};



let frame = 0;
JM.AA3D.frame = frame;

Game_Player.prototype._checkPlayerIsCasting = function(){
  if ($gamePlayer.ABSParams().casting) {
    this.interruptCast();
    }
};
const projData = [];

Game_Player.prototype.saveProjData = function(key, value) {

  projData[key] = value;
  this.projData = projData;
}

Game_Player.prototype.getProjData = function(key) {
  return this.projData[key];
}

//--------------------------------------------------------------------------------
// Game_Player No Target Skill / Model Action

var _gP__performNoTargetAction = Game_Player.prototype._performNoTargetAction;
Game_Player.prototype._performNoTargetAction = function() {
  if(JM_AA3D.params['_useWalkRunSkill'] === true){
    console.log("noTargetAnim");
    if (this._StartFrameCounter === true) return; // NoTargetAnim finished?
    //console.log(Graphics.frameCount);
    this._checkPlayerIsCasting();
    this._attackDir = this._mv3d_data.direction;
    let itemId = this._absParams.battler._equips[0]._itemId,
    name = $dataWeapons[itemId].name.toLowerCase().replace(/ /g,"");
    JM.AA3D.actionName = name;
  try{
    this.frameMax = this.mv3d_sprite.actions[JM.AA3D.actionName][0]._to - 1;
    this._StartFrameCounter = true;
    this.MoveStateActions();
  }catch(error){
    console.warn("Weapon", '"' + [JM.AA3D.actionName] + '"', "is missing a corresponding model action.");
  }
  _gP__performNoTargetAction.call(this);
  }else{
    _gP__performNoTargetAction.call(this);
  }
};

//--------------------------------------------------------------------------------
// Actions Frame Count / Model Action Logic

var _SceneMap_prototype_Update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function(){
  _SceneMap_prototype_Update.call(this);
  //console.log(TouchInput.toPoint());
  //console.log($gamePlayer)
const _gP = $gamePlayer, action = JM.AA3D.actionName;
  if(_gP._StartFrameCounter === true){
      ++JM.AA3D.frame;
    (console.log(JM.AA3D.frame, "frame started"))
    console.log(_gP.frameMax)
    if(JM.AA3D.frame > _gP.frameMax){
      _gP._inActionStopped = false;
      _gP._inActionMoving = false;
      _gP._inActionRunning = false;
      _gP._StartFrameCounter = false;
      JM.AA3D.frame = 0;
      console.log("flagging");
    }
    try{
      if(_gP._inActionStopped === true && _gP.mv3d_sprite.actions[action].isPlaying === false){
        _gP.mv3d_sprite.actions[action.concat("walk")][0]._from = JM.AA3D.frame; //Last frame was
        _gP.mv3d_sprite.actions[action.concat("run")][0]._from = JM.AA3D.frame; //Last frame was
        _gP.mv3d_sprite.actions[action][0]._from = JM.AA3D.frame; //Last frame was
        console.log("switchAnim1",JM.AA3D.frame);
        _gP.MoveStateActions(); //Call 3D actions
        _gP.mv3d_sprite.actions[action.concat("walk")][0]._from = 0; //Reset frame
        _gP.mv3d_sprite.actions[action.concat("run")][0]._from = 0; //Reset frame
        _gP.mv3d_sprite.actions[action][0]._from = 0 //Reset frame
      }
      if(_gP._inActionMoving === true && _gP.mv3d_sprite.actions[action.concat("walk")].isPlaying === false){
        _gP.mv3d_sprite.actions[action][0]._from = JM.AA3D.frame;
        _gP.mv3d_sprite.actions[action.concat("run")][0]._from = JM.AA3D.frame;
        console.log("Switch Anim2",JM.AA3D.frame);
        _gP.MoveStateActions(); //Call 3D actions
        _gP.mv3d_sprite.actions[action][0]._from = 0;
        _gP.mv3d_sprite.actions[action.concat("run")][0]._from = 0;
      }

      if(_gP._inActionRunning === true && _gP.mv3d_sprite.actions[action.concat("run")].isPlaying === false){
        _gP.mv3d_sprite.actions[action][0]._from = JM.AA3D.frame;
        _gP.mv3d_sprite.actions[action.concat("walk")][0]._from = JM.AA3D.frame;
        console.log("switchAnim3",JM.AA3D.frame);
        _gP.MoveStateActions(); //Call 3D actions
        _gP.mv3d_sprite.actions[action][0]._from = 0;
        _gP.mv3d_sprite.actions[action.concat("walk")][0]._from = 0;
      }
    }catch(error){
      console.warn("Action " + '"' + [action] + '"',
      "is missing", [action] + "walk and/or",
      [action] + "run counterpart.");
      return _gP._StartFrameCounter = false; //Bail switch anim
    }
  }     
};

//actions.walk[0]._scene._animationTimeLast

var _mv3d_Character_getActionName = mv3d.Character.prototype.getActionName;
mv3d.Character.prototype.getActionName = function() {
  if (this.falling || this.char.isJumping() && this.char._jumpCount < this.char._jumpPeak) {
    if ('fall' in this.actions) return 'fall';
  }
  if (this.char.isJumping()) {
    if ('jump' in this.actions) return 'jump';
  }
  if (this.platform && Tilemap.isWaterTile(this.platform.tileId)) {
    if (this.idleCount <= 1) {
      if ('swimmove' in this.actions) return 'swimmove';
    }
    if ('swim' in this.actions) return 'swim';
  }
  if (this.idleCount <= 1) {
    if (this.char.isDashing() || this.isFollower && $gamePlayer.isDashing()) {
      if ('run' in this.actions) return 'run';
    }
    if ('walk' in this.actions) return 'walk';
  }
  if ('idle' in this.actions) return 'idle';
};

//--------------------------------------------------------------------------------
// Game_Player Instant Skills and Items / Model Action

var _Game_Player__performSkillMotion = Game_Player.prototype._performSkillMotion;
Game_Player.prototype._performSkillMotion = function() {
  if (JM_AA3D.params['_useWalkRunSkill'] === true) {
    console.log("Playerskill/item") //instant Player skills and items
    var Id = this._absParams.currentAction.skillId;
    //console.log(this);
    //this._cancelCastMotion();
    if (this._absParams.currentAction._isItem === true) {
      var itemName = $dataItems[Id].name;
      JM.AA3D.actionName = itemName.toLowerCase();
      console.log("isItem", itemName)
        try{
          this.frameMax = this.mv3d_sprite.actions[JM.AA3D.actionName][0]._to;
          this._StartFrameCounter = true;
          this.MoveStateActions();
        } catch (error) {
          console.warn("Item", '"' + [JM.AA3D.actionName] + '"',
          "is missing a corresponding model action @",
          this.mv3d_sprite.spriteOrigin._children[0].model_key.replace(/.\/models\/|0|\|/g,""), error);
        }
      } else if (this._absParams.casting === false) {
      var skillName = $dataSkills[Id].name;

      JM.AA3D.actionName = skillName.toLowerCase();
      console.log("isSkill", skillName);
      //console.log(this);
        try{
          this.frameMax = this.mv3d_sprite.actions[JM.AA3D.actionName][0]._to;
          this._StartFrameCounter = true;
          this.MoveStateActions();
        }catch(error){
          console.warn("Skill", '"' + [JM.AA3D.actionName] + '"', 
          "is missing a corresponding model action @", 
          this.mv3d_sprite.spriteOrigin._children[0].model_key.replace(/.\/models\/|0|\|/g,""));
        }
      }
    return;
  }else{
    return _Game_Player__performSkillMotion.call(this);
  }
};

//--------------------------------------------------------------------------------
// Game_Player Casting Skill / Model Action

var _Game_Player__performCastMotion = Game_Player.prototype._performCastMotion;
Game_Player.prototype._performCastMotion = function(){
  if(JM_AA3D.params['_useWalkRunSkill'] === true){
    //this._attackDir = this._mv3d_data.direction;
    console.log("playercast",this);
    var skillId = this._absParams.castingSkill.skillId;
    var commandName = "@p action play";
    var name = $dataSkills[skillId].name;
    mv3d.command(commandName,name);
    this.castingName = name;
    return;
  }else{
    return _Game_Player__performCastMotion.call(this);
  }
};

//--------------------------------------------------------------------------------
// Game_Player Cancel Casting Skill / Model Action

var _Game_Player__cancelCastMotion = Game_Player.prototype._cancelCastMotion;
Game_Player.prototype._cancelCastMotion = function(){
  console.log("playerActStopOutside")
  if(JM_AA3D.params['_useWalkRunSkill'] === true){
    //if(this._absParams._inCastMotion === false){
      //return;
    //}
    var commandName = "@p action stop";
    var name = this.castingName;
    mv3d.command(commandName,name);
    console.log("playerActStop")

    return this._absParams._inCastMotion = false;
  }else{
    return _Game_Player__cancelCastMotion.call(this);
  }
};

//--------------------------------------------------------------------------------
// Game_AIBot Casting Skill / Model Action

var _Game_AIBot__performCastMotion = Game_AIBot.prototype._performCastMotion;
Game_AIBot.prototype._performCastMotion = function(){
  if(JM_AA3D.params['_useWalkRunSkill'] === true){
    this._mv3d_data.direction = this._findDirectionToDiagonal($gamePlayer.x, $gamePlayer.y);
    //this._attackDir = this._findDirectionToDiagonal($gamePlayer.x, $gamePlayer.y);
    //console.log(this._findDirectionToDiagonal($gamePlayer.x, $gamePlayer.y));
    //console.log(this.findDirectionTo($gamePlayer.x, $gamePlayer.y));
    //console.log(this._direction);
    var skillId = this._absParams.currentAction.skillId; //this.battler()._absParams.battleSkillsABS._skillsABS[0].skillId;
    console.log(this._eventId, "Enemy Ev Id");
    //console.log($dataSkills[skillId].name,"Enemy Skill");
    //console.log(this._absParams.currentAction);
    var commandName = "@e" + this._eventId + " action play";
    var name = $dataSkills[skillId].name;
    mv3d.command(commandName,name);
    return this._absParams._inCastMotion = true;
  }else{
    return _Game_AIBot__performCastMotion.call(this);
  }
};

//--------------------------------------------------------------------------------
// Game_AIBot Cancel Casting Skill / Model Action

var _Game_AIBot__cancelCastMotion = Game_AIBot.prototype._cancelCastMotion;
Game_AIBot.prototype._cancelCastMotion = function(){
  console.log("cancelcastEn");
  if (JM_AA3D.params['_useWalkRunSkill'] === true){
    if (this._absParams.currentAction != undefined){
    if (this._absParams._inCastMotion === false) { //TRUE??
      var skillId = this._absParams.currentAction.skillId;
      var commandName = "@e" + this._eventId + " action stop";
      var name = $dataSkills[skillId].name;
      mv3d.command(commandName,name);
    }
  }
    return this._absParams._inCastMotion = false;
  } else {
    return _Game_AIBot__cancelCastMotion.call(this);
  }
};

//--------------------------------------------------------------------------------
// Game_AIBot Skills / Model Action

var _Game_AIBot__performSkillMotion = Game_AIBot.prototype._performSkillMotion;
Game_AIBot.prototype._performSkillMotion = function(){
  if (JM_AA3D.params['_useWalkRunSkill'] === true){console.log(this._direction);
    console.log(this._direction)
    this._mv3d_data.direction = this._findDirectionToDiagonal($gamePlayer.x, $gamePlayer.y);
    //this._direction = this._findDirectionToDiagonal($gamePlayer.x, $gamePlayer.y);
    console.log(this._direction, this)
    //this.turnTowardCharacter(this.target());
    if (this._absParams._inCastMotion === true){
      var skillId = this._absParams.currentAction.skillId;
      console.log(this);
      console.log(this._absParams.castingSkill.skillId);
      var commandName = "@e" + this._eventId + " action play";
      var name = $dataSkills[skillId].name;
      mv3d.command(commandName,name,"important");
      return console.log("SkillMotionSuccEn");
    }
  } else {
    return _Game_AIBot__performSkillMotion.call(this);
  }
};

//--------------------------------------------------------------------------------
// Game_AIBot DeadState / Direction Fix

Game_AIBot.prototype._changeEventToDeadState = function(){
  var key;
  key = [$gameMap.mapId(), this.eventId(), AlphaABS.Parameters.get_EnemyDeadSwitch()];
  $gameSelfSwitches.setValue(key, true);
  return this._storeDeadData();//,
         //this._originalDirection;
};

//--------------------------------------------------------------------------------
// Game_AIBot TeleportToPoint

Game_AIBot.prototype.performTeleportToPoint = function(point) {
  var animationId;
  if ((point == null) || (point.x === $gamePlayer._x && point.y === $gamePlayer._y)) {
    return;
  }
  //"PERFORM TP".pe()
  animationId = AlphaABS.Parameters.get_EnemyTeleportAnimationId();
  if (animationId > 0) {
    this.requestAnimationABS(animationId);
  }
  this.locate(point.x, point.y);
  console.log(this.z)
};

//--------------------------------------------------------------------------------
// Game_CharacterBase: Jump / Z Collision Fix

const _charBase_jump = Game_CharacterBase.prototype.jump;
Game_CharacterBase.prototype.jump = function(xPlus, yPlus) {
  if (mv3d.isDisabled()) {return _charBase_jump.apply(this, arguments);}
  //console.log(mv3d.getWalkHeight(this.x, this.y));
  this.mv3d_jumpHeightStart = this.z != null ? this.z : mv3d.getWalkHeight(this.x, this.y);
  this.mv3d_jumpHeightEnd = mv3d.getWalkHeight(this.x + xPlus, this.y + yPlus); //this.mv3d_jumpHeightStart;
  _charBase_jump.apply(this, arguments);
  //this._x += xPlus;
  //this._y += yPlus;
  //var distance = Math.round(Math.sqrt(xPlus * xPlus + yPlus * yPlus));
  //this._jumpPeak = 10 + distance - this._moveSpeed;
  //this._jumpCount = this._jumpPeak * 2;
  //this.resetStopCount();
  //this.straighten();
};

//--------------------------------------------------------------------------------
// Game_Player: Jump / 8dir fix

Game_Player.prototype.jump = function(xPlus, yPlus) {
  const BaseX = this.x, BaseY = this.y;
  //console.log(this.x);
  
  // Jump destination canPass()?
  switch(this._mv3d_data.direction) {
    case 2: xPass = BaseX;     yPass = BaseY + 1; 
            xPlus = 0;         yPlus = 1;
            break; // DOWN
    case 4: xPass = BaseX - 1; yPass = BaseY;     
            xPlus = - 1;       yPlus = 0;   
            break; // LEFT
    case 6: xPass = BaseX + 1; yPass = BaseY;    
            xPlus = 1;         yPlus = 0;  
            break; // RIGHT
    case 8: xPass = BaseX;     yPass = BaseY - 1; 
            xPlus = 0;         yPlus = - 1; 
            break; // UP
    case 1: xPass = BaseX - 1; yPass = BaseY + 1; 
            xPlus = - 1;       yPlus = 1;   
            break; // DOWN LEFT
    case 3: xPass = BaseX + 1; yPass = BaseY + 1; 
            xPlus = 1;         yPlus = 1;   
            break; // DOWN RIGHT
    case 7: xPass = BaseX - 1; yPass = BaseY - 1; 
            xPlus = - 1;       yPlus = - 1; 
            break; // UP LEFT
    case 9: xPass = BaseX + 1; yPass = BaseY - 1; 
            xPlus = 1;         yPlus = - 1; 
            break; // UP RIGHT
  }
  //console.log(mv3d.getEventsAt(xPass, yPass).length);
  if (this.canPass(xPass, yPass, this._mv3d_data.direction)) { // && mv3d.getEventsAt(xPass, yPass).length === 0
    Game_Character.prototype.jump.call(this, xPlus, yPlus);
    //console.log(this.collidesWithAnyCharacter(this.collider()));
    //console.log(this.isCollidedWithEvents(xPass, yPass));
  } else { 
    // Cannot jump to destination safely / jump in place
    console.log("ELSE", this);
    xPlus = 0;
    yPlus = 0;
    Game_Character.prototype.jump.call(this, xPlus, yPlus);
    //console.log(this.isCollidedWithEvents(xPass, yPass));
  }
  
};

//--------------------------------------------------------------------------------
// Game_Character AI: Impulse (knockback) / Z collision fix

Game_Character.prototype.onApplyImpulseForce = function(x, y, d) {
  if ((x === 1 || x === -1 || x === 0) && (y === 1 || y === -1 || y === 0)) {
    //console.log(x,y,d)
    //console.log("ImpulseForce")
    const BaseX = this.x, BaseY = this.y;
    var ld;
    ld = this._mv3d_data.direction;
    // Jump destination canPass()?
    switch($gamePlayer._attackDir) {
      case 2: xPass = BaseX; yPass = BaseY + 1; 
              xPlus = 0;     yPlus = 1;   
              break; // DOWN
      case 4: xPass = BaseX - 1; yPass = BaseY;     
              xPlus = - 1;       yPlus = 0;   
              break; // LEFT
      case 6: xPass = BaseX + 1; yPass = BaseY;    
              xPlus = 1;         yPlus = 0;  
              break; // RIGHT
      case 8: xPass = BaseX;     yPass = BaseY - 1; 
              xPlus = 0;         yPlus = - 1; 
              break; // UP
      case 1: xPass = BaseX - 1; yPass = BaseY + 1; 
              xPlus = - 1;       yPlus = 1;   
              break; // DOWN LEFT
      case 3: xPass = BaseX + 1; yPass = BaseY + 1; 
              xPlus = 1;         yPlus = 1;   
              break; // DOWN RIGHT
      case 7: xPass = BaseX - 1; yPass = BaseY - 1; 
              xPlus = - 1;       yPlus = - 1; 
              break; // UP LEFT
      case 9: xPass = BaseX + 1; yPass = BaseY - 1; 
              xPlus = 1;         yPlus = - 1; 
              break; // UP RIGHT
    }
    if (this.canPass(xPass, yPass, $gamePlayer._attackDir)) {
      this.jump(xPlus, yPlus);
      this._mv3d_data.direction = ld;
    } else { 
      // Cannot jump to destination safely / jump in place
      this.jump(0, 0);
    }
  } else {
    this._onComplexImpulse(x, y, d);
  }
};

//--------------------------------------------------------------------------------
// Game_Character: AI Complex Impulse (knockback >1) / Z collision fix

Game_Character.prototype._onComplexImpulse = function(x, y, d) {
  console.log(x,y,d);
  console.log(this.x, this.y, this._mv3d_data.direction)
  const BaseX = this.x, BaseY = this.y;
  const impulse = $gamePlayer._absParams.currentAction.impulse;
  console.log(impulse);
  var ld;
  ld = this._mv3d_data.direction;
  // Jump destination canPass()? & Impulse Vars
  switch($gamePlayer._attackDir) {
    case 2: xPass = BaseX;           yPass = BaseY + impulse; 
            xPlus = 0;               yPlus = impulse;         
            break; // DOWN
    case 4: xPass = BaseX - impulse; yPass = BaseY;           
            xPlus = - impulse;       yPlus = 0;
            break; // LEFT
    case 6: xPass = BaseX + impulse; yPass = BaseY;           
            xPlus = impulse;         yPlus = 0;
            break; // RIGHT
    case 8: xPass = BaseX;           yPass = BaseY - impulse; 
            xPlus = 0;               yPlus = - impulse;
            break; // UP
    case 1: xPass = BaseX - impulse; yPass = BaseY + impulse; 
            xPlus = - impulse;       yPlus = impulse;
            break; // DOWN LEFT
    case 3: xPass = BaseX + impulse; yPass = BaseY + impulse; 
            xPlus = impulse;         yPlus = impulse;
            break; // DOWN RIGHT
    case 7: xPass = BaseX - impulse; yPass = BaseY - impulse; 
            xPlus = - impulse;       yPlus = - impulse;
            break; // UP LEFT
    case 9: xPass = BaseX + impulse; yPass = BaseY - impulse;
            xPlus = impulse;         yPlus = - impulse;
            break; // UP RIGHT
  }
  if (this.canPass(xPass, yPass, $gamePlayer._attackDir)) {
    this.jump(xPlus, yPlus);
    this._mv3d_data.direction = ld;
  } else {
    // Cannot jump to destination safely / jump in place
    this.jump(0, 0);
  }
};

_alias_Game_Event_updateSelfMovement = Game_Event.prototype.updateSelfMovement;
Game_AIBot.prototype.updateSelfMovement = function() {
  if (this._moveType === 7) {
    if (this.inBattle()) {
      if (!this._locked && this.isNearTheScreen() && this.checkStop(this.stopCountThreshold())) {
        if (this.isCanPerformTeleportNow()) {
          this.performTeleportToTarget();
        }
        this._moveType = 2;
        return;
      }
    }
  }
  _alias_Game_Event_updateSelfMovement.call(this, arguments);
};


//Game_CharacterBase.prototype.collisionCheck = function(x, y, dir, dist, type) {

//  function checkPlusMinusOne(variable, target) {
 //   return(
 //     variable === target + 2 || 
 //     variable === target - 2 ||
  //    variable === target + 1 ||
  //    variable === target - 1 || 
  //    variable === target
  //  );
 // }

  //this.collider(type).moveTo(x, y);
 // if (!this.valid(type)) return false;
 // if (this.isThrough() || this.isDebugThrough()) return true;
 // var d = dir;
 // //Midpass is falsy for enemies and not falling through to true when removing midpass either.
  //if ($gameMap.midPass() && dir !== 5 && (mv3d.getTileConfig(x/48,y/48).height != undefined)) {
 //   if (!this.middlePass(x, y, dir, dist, type)) return false; //Force return true
  //}

 // if (this.collidesWithAnyTile(type)) return false;
 // if (this.collidesWithAnyCharacter(type)&& (mv3d.getTileConfig(x/48,y/48).height != undefined)) return false;
  //if (checkPlusMinusOne(this.x, $gamePlayer.x) && checkPlusMinusOne(this.y, $gamePlayer.y) === true) return false;
  //console.log(this.z, mv3d.getTileConfig((~~x/48),(~~y/48)).height);
 // console.log(this, "AI")
 // console.log(checkPlusMinusOne(~~$gamePlayer.x, ~~Game_AIBot.x))
 // return true;
//};


//--------------------------------------------------------------------------------
// Game_Player: VectorSkill / 8dir fix

Game_Player.prototype.AA3DfreeDirection = function(X, Y, rad) {
  // Convert angle to radians
  const angle = this._mv3d_data.blenders.direction * Math.PI / 180 * -1 + (Math.PI / 2);
  let _attackX, _attackY;
  this._attackX = _attackX,
  this._attackY = _attackY;
  // Calculate x and y coordinates
  const x = X + rad * Math.cos(angle);
  const y = Y + rad * Math.sin(angle);
  
  return this._attackX = x, this._attackY = y;
};

Game_Player.prototype._findEndPointForVectorSkill = function() {
  var absSkill;
  absSkill = this._absParams.currentAction;
  if (absSkill.isFreeDirection()) {
    if (JM_AA3D.params['_useFreeDir'] === true) {
      this.AA3DfreeDirection(this.x, this.y, 10); // Add radius adjustment?
      var point = new KDCore.Point(this._attackX, this._attackY);
    }else{
      x = this.x, y = this.y;
      switch ($gamePlayer._attackDir) {
        case (2): x += 0;  y += 1;  break; // DOWN
        case (4): x += -1; y += 0;  break; // LEFT
        case (6): x += 1;  y += 0;  break; // RIGHT
        case (8): x += 0;  y += -1; break; // UP
        case (1): x += -1; y += 1;  break; // DOWN LEFT
        case (3): x += 1;  y += 1;  break; // DOWN RIGHT
        case (7): x += -1; y += -1; break; // UP LEFT
        case (9): x += 1;  y += -1; break; // UP RIGHT
      }
      var point = new KDCore.Point(x, y);
    }
    //console.log(cursor, "OVERRIDE WORKING");
    return AlphaABS.UTILS.getEndPointFromChartToRangeNoFixed(this, absSkill.range, point);
  } else {
    return AlphaABS.UTILS.getEndPointFromCharToRange(this, absSkill.range);
  }
};

//--------------------------------------------------------------------------------
// Game_SVector Class: VectorSkill Projectile

// Init projectileNote on MapLoaded for each available skill & all weapons -------
var _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
Scene_Map.prototype.onMapLoaded = function(){
  _Scene_Map_onMapLoaded.call(this);

  // dispose() preloaded projectile particles for GamePlayer and AI
  if (JM.AA3D.tempProjectile) {
    for (let i = 0; i < Object.keys(JM.AA3D.tempProjectile.gP.particle).length; i++){
      //console.log(mv3d.scene.getMeshByID("sphereSpark"), Object.keys(ev.particle).length);
      mv3d.scene.getMeshByID("sphereSpark").dispose();
      }    
      JM.AA3D.tempProjectile.forEach(ev => {
      for (let i = 0; i < Object.keys(ev.particle).length; i++){
      console.log(mv3d.scene.getMeshByID("sphereSpark"), Object.keys(ev.particle).length);
      mv3d.scene.getMeshByID("sphereSpark").dispose();
      }
    });
  }

  // init tempProjectile------------------------------------------------------------
  JM.AA3D.tempProjectile = [];

  var gP = "gP";
  console.log("MAPLOADED");
  ColliderManager._needsRefresh = true;
  setTimeout(() => {
    $dataWeapons.forEach(WIndex => {
      if (WIndex != null && WIndex != "null"){
        if (WIndex.note != "" && (WIndex.id != $gamePlayer._absParams.battler._equips[0]._itemId)){ console.log(WIndex.id)
          var WN = WIndex.name.toLowerCase().replace(/ /g,"");
          mv3d.scene.getMeshByID(WN).visibility = 0;
          console.log(mv3d.scene.getMeshByID(WN));
          console.log($gamePlayer._absParams.battler._equips[0]);
        }
      }
    }); 

    // Load/Reload projectile Notes---------------------------------------------------    
    AlphaABS.LIBS.Game_SVector.prototype.loadprojectileNote();

    // Preload all particles and models from Game_Player Skill Panel -----------------
    $gamePlayer._absParams.battler._absParams.battleSkillsABS._skillsABS.forEach(m => {
      JM.AA3D.tempProjectile[gP] = [];
      JM.AA3D.tempProjectile[gP].model = [];
      JM.AA3D.tempProjectile[gP].particle = [];
      JM.AA3D.tempProjectile[gP].sprite = [];
        console.log(m);
        console.log(JM_AA3D.params['_useProjectileModel'])
      if (m.img != null && m.img != "null"){
        if (((JM_AA3D.params['_useProjectileModel'] === 1) && !m.projectileNote) || m.projectileNote === "model"){
          AlphaABS.LIBS.Game_SVector.prototype.asyncImportModel(gP, m.img);
          
        }
        if (((JM_AA3D.params['_useProjectileModel'] === 3) && !m.projectileNote) || m.projectileNote === "particle"){
          AlphaABS.LIBS.Game_SVector.prototype.ImportParticle(gP, m.img);
          console.log(m.img);
          console.log(m.projectileNote);
        }
      }
    });

    // Preload all particles and models from $dataWeapons ------------------------------
    $dataWeapons.forEach(Weap => {
      if (Weap != null && Weap != "null" ){
        if (Weap.note != ""){
        console.log(Weap);
        if (((JM_AA3D.params['_useProjectileModel'] === 1) && !Weap.meta.projectile) || Weap.meta.projectile === "model"){
          AlphaABS.LIBS.Game_SVector.prototype.asyncImportModel(gP, Weap.meta.img);
          
        }
        if (((JM_AA3D.params['_useProjectileModel'] === 3) && !Weap.meta.projectile) || Weap.meta.projectile === "particle"){
          AlphaABS.LIBS.Game_SVector.prototype.ImportParticle(gP, Weap.meta.img);
          console.log(Weap.meta.img);
          console.log(Weap.meta.projectile);
        }
        }
      }
    });

    // Starting z position for Player
    $gamePlayer.mv3d_sprite.z = mv3d.getTileHeight($gamePlayer._x, $gamePlayer._y, 0);

    // Preload all particles and models from AI Skills --------------------------------   
    $gameMap._events.forEach(AI => {
      if (AI != null){
        if (AI._absParams.battler != undefined){
          // Starting z position for AI Bots
          AI.z = mv3d.getTileHeight(AI._x, AI._y, 0);
          //
          var skills = AI._absParams.battler._absParams.battleSkillsABS._skillsABS;
          //var eId = AI._eventId;
          //console.log(skills);
          JM.AA3D.eId = AI._eventId;
          JM.AA3D.tempProjectile[AI._eventId] = [];
          JM.AA3D.tempProjectile[AI._eventId].model = [];
          JM.AA3D.tempProjectile[AI._eventId].particle = [];
          JM.AA3D.tempProjectile[AI._eventId].sprite = [];
          for (let i = 0; i < skills.length; i++){
            //console.log(AI);
            var Skill = skills[i].img;
          //console.log(img);
            if (skills[i].img != null && skills[i].img != "null"){
              if (((JM_AA3D.params['_useProjectileModel'] === 1) && !skills[i].projectileNote) || skills[i].projectileNote === "model"){
                AlphaABS.LIBS.Game_SVector.prototype.asyncImportModel(AI._eventId, Skill);
              }
              if (((JM_AA3D.params['_useProjectileModel'] === 3) && !skills[i].projectileNote) || skills[i].projectileNote === "particle"){
                AlphaABS.LIBS.Game_SVector.prototype.ImportParticle(AI._eventId, Skill);
                //console.log("NotFlagging?")
              }
            }
            //console.log(Skill);
          }
        } 
      }
    }); //console.log(JM.AA3D.tempProjectile)
  }, "1000");
}

// Projectile: Load projectileNote -------------------------------------------------------
AlphaABS.LIBS.Game_SVector.prototype.loadprojectileNote = function() {
//$gamePlayer._eventId = "gP";
Object.defineProperty($gamePlayer, "_eventId", {
  value: "gP"
});
$gamePlayer._absParams.battler._absParams.battleSkillsABS._skillsABS.forEach(P => {
  if (mv3d.readConfigurationBlocks($dataSkills[P.skillId].note,'projectile') && P != 0) {
      P.projectileNote = mv3d.readConfigurationBlocks($dataSkills[P.skillId].note,'projectile').replace(/\n/g, '');  
      //console.log(P.projectileNote)
  } else {
    P.projectileNote = false;
  }
});

$gameMap._events.forEach(AI => {
  try{
    if (AI._absParams.battler != undefined) {
      skills = AI._absParams.battler._absParams.battleSkillsABS._skillsABS;
      for (let i = 0; i < skills.length; i++) {
        if (mv3d.readConfigurationBlocks($dataSkills[AI._absParams.battler._absParams.battleSkillsABS._skillsABS[i].skillId].note, 'projectile')){
          var projectileNote = mv3d.readConfigurationBlocks($dataSkills[AI._absParams.battler._absParams.battleSkillsABS._skillsABS[i].skillId].note, 'projectile').replace(/\n/g, ''); 
          AI._absParams.battler._absParams.battleSkillsABS._skillsABS[i].projectileNote = projectileNote;
          console.log(AI._absParams.battler._absParams.battleSkillsABS._skillsABS[i].projectileNote)
        } else {
          AI._absParams.battler._absParams.battleSkillsABS._skillsABS[i].projectileNote = false;
        }
      }
    }
  }catch{

  }
  });
};

// Projectile: Model Async Loader -------------------------------------------------------
AlphaABS.LIBS.Game_SVector.prototype.asyncImportModel = async function(eId, imgName) { console.log("IMPORT MODEL")

  let result = await BABYLON.SceneLoader.ImportMeshAsync(null, "./models/", imgName + ".glb", mv3d.scene) 
  result.meshes[0].setEnabled(false); // Set preloaded models to disabled until used and refreshed.
  result.meshes.forEach(mesh => mesh.renderingGroupId = mv3d.enumRenderGroups.MAIN);
  //animationGroups[1].start(true);
  JM.AA3D.tempProjectile[eId].model[imgName] = result.meshes[0];
};

// Projectile: Particle Async Loader -------------------------------------------------------
AlphaABS.LIBS.Game_SVector.prototype.ImportParticle = async function(eId, imgName) { console.log("IMPORT PARTICLE")

  let sphereSpark = await BABYLON.MeshBuilder.CreatePlane("sphereSpark", {width: 1, height: 1}, mv3d.scene);
	sphereSpark.isVisible = false;
  sphereSpark.z = -10;

  const assetsManager = new BABYLON.AssetsManager(mv3d.scene);
  const particleTexture = assetsManager.addTextureTask("projectile particle texture", "./particles/" + imgName + ".png");
  const particleFile = assetsManager.addTextFileTask("projectile particle system", "./particles/" + imgName + ".json"); //imgName

  assetsManager.load();

  assetsManager.onFinish = function(tasks) {
    console.log("tasks successful", tasks);
    // prepare to parse particle system files
    const particleJSON = JSON.parse(particleFile.text);
    // check GPU support
    if (BABYLON.GPUParticleSystem.IsSupported) {
      myParticleSystem = BABYLON.GPUParticleSystem.Parse(particleJSON, mv3d.scene, "", false); //10000
    } else { // switch to software rendering
      myParticleSystem = BABYLON.ParticleSystem.Parse(particleJSON, mv3d.scene, "", false);
    }
    myParticleSystem.emitter = sphereSpark;
    // set particle texture
    myParticleSystem.particleTexture = particleTexture.texture;
    // Preloaded Cycles before rendering
    myParticleSystem.preWarmCycles = particleJSON.emitRate;
    //myParticleSystem.maxEmitPower = 1;
    //myParticleSystem._accumulatedCount = 1;
    myParticleSystem.updateSpeed = 0.2;
    //myParticleSystem.emitRate = 5;
    myParticleSystem.renderingGroupId = mv3d.enumRenderGroups.MAIN;
  }
  JM.AA3D.tempProjectile[eId].particle[imgName] = sphereSpark;
  //JM.AA3D.tempProjectile[eId].particle[imgName].push(sphereSpark);
  
  //console.log(imgName);
  //console.log(JM.AA3D.tempProjectile);
};

// Projectile: Dispose ------------------------------------------------------------
AlphaABS.LIBS.Game_SVector.prototype.dispose = function() {
  console.log("dispose proj");
  try {
    this.projectile.dispose();
    //LOG.p("SVector : Disposed ");
    var t = this.sprite.parent;
    if (t) {
      t.removeChild(this.sprite);
    }
    if (this._emit) {
      this._emit.stop();
      this._emit.clear();
    }
    if (BattleManagerABS.isABSLightingExt() && this._myPoint) {
      $gameMap.deleteLight(this._myPoint.x, this._myPoint.y);
    }
  } catch (e) {
    console.error(e);
  } finally {
    this.sprite = null;
    this._disposed = true;
  }
};

// Projectile: Starting Point ------------------------------------------------------
AlphaABS.LIBS.Game_SVector.prototype._startPoint = function() {
  console.log("STARTPOINT")
  var point = this._data.subject.toPoint();
  try {
    var direction = this._data.subject.direction();
    this._startedDirection = direction;
    this._applyAnchorByDirection(direction);
  } catch (e) {
    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;
  }
  return point;
};

// Projectile: Vector Logic --------------------------------------------------------
AlphaABS.LIBS.Game_SVector.prototype._imageToPoint = function() {
  //console.log("IMAGETOPOINT", this._data);
  if (this._myPoint == null)
    return;

  var X = this._myPoint._x;
  var Y = this._myPoint._y;

  var x = this._myPoint.screenX();
  var y = this._myPoint.screenY();

  this.sprite.x = x;
  this.sprite.y = y;
  //console.log(this._imageSpr._frame.x);
  //console.log(this._imageSpr._frameCount);
  //console.log(this._imageSpr._bitmap.__baseTexture.realWidth);
  //console.log(this._imageSpr._animIndex);
  //console.log(this._imageSpr);

  if (!this.name || (!this.projectileNote && JM_AA3D.params['_useProjectileModel'] === 2) || this.projectileNote === "sprite") { 
    try{
      this.texture.uOffset = this._imageSpr._texture._uvs.x1;
    }catch{
      this.texture.uOffset = 0;
    }
    rotDir2 = Math.PI / 2;
  } else if (((!this.projectileNote) && (JM_AA3D.params['_useProjectileModel'] === 1)) && this.name || this.projectileNote === "model") {
      this.projectile.setEnabled(true);
      var rotDir2 = 0;
      //this.rotDir = (this._data.subject._mv3d_data.blenders.direction) * Math.PI / 180 * -1 + Math.PI / 2;
      //console.log(this._imageSpr.parent.rotation);
      //console.log(this.projectileNote);
  } else if ((!this.projectileNote && JM_AA3D.params['_useProjectileModel'] === 3) || this.projectileNote === "particle"){ // Particle
      var rotDir2 = 0;
  }
  //this._data.skill.freeDirection === 1 &&
  //if (JM_AA3D.params['_useProjectileModel'] === 1) {
  //  this.projectile.rotation = new BABYLON.Vector3(this.rotDir2, this.rotDir, 0);
    //console.log(this.projectile)
  //} else {
    //this.projectile.rotation = new BABYLON.Vector3(Math.PI/2, this.rotDir, 0);
  //}
  //plane.rotation.x = BABYLON.Tools.ToRadians(90)
  if (this._data.target.toPoint) {
    //console.log(this)
    this.projectile.position.x = X;
    this.projectile.position.z = (Y * -1);
    this.projectile.position.y = this._data.subject.z + 0.5;
    //console.log(this.sprite.rotation);
    var rotDir = this.sprite.rotation;
    this.projectile.rotation = new BABYLON.Vector3(rotDir2, rotDir, 0)
    //console.log("THIS", this._data.subject);
  }
};

// Projectile: Endpoint (May use this to switch to an ending animation action)
AlphaABS.LIBS.Game_SVector.prototype._endPoint = function() {
  //console.log("ENDPOINT");
  try {
    if(this._data.target.toPoint){

      return this._data.target.toPoint();}
    else {
      //console.log("TARGETREACH")
      return new KDCore.Point(this._data.target.x, this._data.target.y);
    }
  } catch (e) {
    console.warn(e);
    return KDCore.Point.Empty.clone();
  }
};

// Projectile: Set Sprite and/or Model ------------------------------------------------
AlphaABS.LIBS.Game_SVector.prototype._setImage = function(name) {
  const scene = mv3d.scene;
  if (name) {
    var imgSpr;
    if (name == 'null') {
      console.log("name is not defined???????")
      this.name = false;
      imgSpr = new Sprite();
      V4 = new BABYLON.Vector4(0, 0, 1, 1);
      this.texture = new BABYLON.Texture(AlphaABS.DATA.IMG.Vector.bitmap._url, scene);
      projectile = BABYLON.MeshBuilder.CreatePlane("NullSpriteProj", {width: 1, height: 1, sideOrientation: BABYLON.Mesh.DOUBLESIDE, frontUVs: V4, backUVs: V4}, scene);
      projectile.renderingGroupId = mv3d.enumRenderGroups.MAIN;
      this.projectile = projectile;
      const material = new BABYLON.StandardMaterial("material", scene);
      //material.diffuseColor = new BABYLON.Color3(1,1,1);
      material.backFaceCulling = true;
      material.alphaCutOff = mv3d.ALPHA_CUTOFF;
      material.diffuseTexture = this.texture;
      material.diffuseTexture.hasAlpha = true;
      material.ambientColor.set(1,1,1);
      material.specularColor.set(1,1,1);
      material.maxSimultaneousLights = 25;
      this.projectile.material = material;
      //console.log(this._data.subject._mv3d_data.blenders.direction);
      //console.log(imgSpr);
      //console.log(AlphaABS.DATA.IMG.Vector.bitmap, "FLAG");
    } else {
      this.name = true;
   //   let index = -1;
    //  const skills = this._data.subject._absParams.battler._absParams.battleSkillsABS._skillsABS;
   //   for (let i = 0; i < skills.length; i++) {
       // if (skills[i].skillId === this._data.skill.skillId) {
         // if (skills[0].skillId === this._data.skill.skillId) {
         //   index = mv3d.readConfigurationBlocks($dataWeapons[$gamePlayer._absParams.battler._equips[0]._itemId].note, 'projectile')
         //   break;
        //  }else{
          //  index = this._data.subject._absParams.battler._absParams.battleSkillsABS._skillsABS[i].projectileNote;
          //  break;
          //}
       // }
      //}
      //console.log(this._data.subject._absParams.battler._absParams.battleSkillsABS._skillsABS[this._data.subject._absParams.currentAction.skillId].projectileNote)
      console.log(this._data.subject._absParams.battler._absParams.battleSkillsABS._skillsABS)
      console.log(this);
      console.log(this._data.subject);
      
      // changeEquip / Copy projectileNote from current Equip to skillId 1 ------------
      if ($dataWeapons[$gamePlayer._absParams.battler._equips[0]._itemId] != null) {
        $gamePlayer._absParams.battler._absParams.battleSkillsABS._skillsABS[0].projectileNote = 
        $dataWeapons[$gamePlayer._absParams.battler._equips[0]._itemId].meta.projectile;
      }
      this.projectileNote = this._data.skill.projectileNote;
     
      if ((!this.projectileNote && JM_AA3D.params['_useProjectileModel'] === 2) || this.projectileNote === "sprite") {
        imgSpr = new AlphaABS.LIBS.Sprite_Vector(name);
        this.texture = new BABYLON.Texture(imgSpr._bitmap.url, scene);
        //this.rotDir = (this._data.subject._mv3d_data.blenders.direction) * Math.PI / 180 * -1 + Math.PI / 2;
      } else {
        imgSpr = new Sprite();
        //this.rotDir = (this._data.subject._mv3d_data.blenders.direction) * Math.PI / 180 * -1;
        //console.log(imgSpr, "REEEE");
      }
      
      
      //console.log(imgSpr._frameCount)
      if (((!this.projectileNote) && JM_AA3D.params['_useProjectileModel'] === 1) || this.projectileNote === "model") { // && JM.AA3D[$gamePlayer._absParams.currentAction.img] != undefined
        //if (JM.AA3D.tempProjectile[this._data.subject._eventId].model[name] != undefined) {
          this.projectile = JM.AA3D.tempProjectile[this._data.subject._eventId].model[name];
          this.asyncImportModel([this._data.subject._eventId], name);
        //} else {
          //JM.AA3D[$gamePlayer._absParams.currentAction.img]
        //  this.projectile = JM.AA3D.tempProjectile[JM.AA3D.eId].model[name];
        //  this.asyncImportModel([JM.AA3D.eId], name);
        //}
        console.log(this)
        console.log("MODEL");
      } else if (((!this.projectileNote) && JM_AA3D.params['_useProjectileModel'] === 3) || this.projectileNote === "particle"){
        //if (JM.AA3D.tempProjectile[this._data.subject._eventId].particle[name] != undefined) {
          this.projectile = JM.AA3D.tempProjectile[this._data.subject._eventId].particle[name];
          this.ImportParticle([this._data.subject._eventId], name);
        //} else {
        //  if (this._data.subject === $gamePlayer) {
        //    var gP = "gP";
        //    console.log("$gamePlayer");
        //  }
        //  this.projectile = JM.AA3D.tempProjectile[gP].particle[name];
        //  console.log("PARTICLE CATCH", JM.AA3D.tempProjectile[gP].particle[name]);
        //  this.ImportParticle(gP, name);
        //  console.log(JM.AA3D.tempProjectile[JM.AA3D.eId].particle[name])
        //}
        //console.log(this._data.subject);
        console.log("PARTICLE");
        
      } else {
        V4 = new BABYLON.Vector4(0,0, 1 / imgSpr._frameCount, 1);
        projectile = BABYLON.MeshBuilder.CreatePlane("SpriteProj", {width: 1, height: 1, sideOrientation: BABYLON.Mesh.DOUBLESIDE, frontUVs: V4, backUVs: V4, wrap: true}, scene);
        projectile.renderingGroupId = mv3d.enumRenderGroups.MAIN;
        const material = new BABYLON.StandardMaterial("material", scene);
        //material.diffuseColor = new BABYLON.Color3(1,1,1);
        material.backFaceCulling = true;
        material.alphaCutOff = mv3d.ALPHA_CUTOFF;
        material.diffuseTexture = this.texture;
        material.diffuseTexture.hasAlpha = true;
        material.ambientColor.set(1,1,1);
        material.specularColor.set(1,1,1);
        material.maxSimultaneousLights = 25;
        projectile.material = material;
        JM.AA3D.tempProjectile[JM.AA3D.eId].sprite[name] = projectile;
        this.projectile = JM.AA3D.tempProjectile[JM.AA3D.eId].sprite[name];
        console.log("SPRITE");
        console.log(this.projectile);
       }
    }
    this._imageSpr = imgSpr;
    this.sprite = new Sprite();
    this.sprite.addChild(imgSpr);
    console.log(this);
    this._imageSpr.visible = false;
  } else {
    this._imageSpr = new Sprite(); // * Empty?
    this.sprite = new Sprite(new Bitmap(76, 38));
    //console.log("DONT FLAG")
  }
};

AlphaABS.LIBS.AIStateBattle.prototype._updateApproachState = function () {
  console.log("updateApproachState")
  this._updateSupportAction();
  if (this.isStayStill) {
    this._stayAndTurn();
    if (!AlphaABS.LIBS.AILogicManager.targetInVisibleRange(this._bot)) {
      return this._bot.changeStateToReturn();
    }
  } else {
    // canPass() LOOKUP TABLE
    var x = this._bot._x, y = this._bot._y;
    switch (this._bot._mv3d_data.direction) {
      case 2: x += 0;  y += 1; break; // DOWN
      case 4: x += -1; y += 0; break; // LEFT
      case 6: x += 1;  y += 0; break; // RIGHT
      case 8: x += 0;  y += -1; break; // UP
      case 1: x += -1; y += 1; break; // DOWN LEFT
      case 3: x += 1;  y += 1; break; // DOWN RIGHT
      case 7: x += -1; y += -1; break; // UP LEFT
      case 9: x += 1;  y += -1; break; // UP RIGHT
    }
    if (!this._bot.canPass(x, y, this._bot._mv3d_data.direction)) {
      
      this._bot._moveType = 1;

      //this._bot.moveStraight(8);
    }
    //if (AlphaABS.UTILS.distanceTo(this._bot, $gamePlayer) > (this._bot._absParams.returnRadius * 2)) {
    //  return this._bot.changeStateToReturn();
    //}
    if (AlphaABS.LIBS.AILogicManager.inOutReturnRange(this._bot)) {
      return this._bot.changeStateToReturn();
    }
  }
}

AlphaABS.LIBS.AIStateBattle.prototype._whenNeedApproachTarget = function () {
  //if (AlphaABS.UTILS.distanceTo(this._bot, $gamePlayer) > (this._bot._absParams.returnRadius * 2)) {
  //  return this._bot.changeStateToReturn();
  //}
  console.log("whenNeedApproachTarget")
  var action;
  action = this._bot.currentAction();
  if ((action != null) && action.isCasting()) {
    action.resetCast();
    this._bot._cancelCastMotion();
  }
  // canPass() LOOKUP TABLE
  var x = this._bot._x, y = this._bot._y;
  switch (this._bot._mv3d_data.direction) {
    case 1: x += -1; y += 1; break; // DOWN LEFT
    case 2: x += 0;  y += 1; break; // DOWN
    case 3: x += 1;  y += 1; break; // DOWN RIGHT
    case 4: x += -1; y += 0; break; // LEFT
    case 6: x += 1;  y += 0; break; // RIGHT
    case 7: x += -1; y += -1; break; // UP LEFT
    case 8: x += 0;  y += -1; break; // UP
    case 9: x += 1;  y += -1; break; // UP RIGHT
  }
  if (!this._bot.canPass(x, y, this._bot._mv3d_data.direction)) {
    //this._bot._moveType = 1;
    console.log("CANTPASS");

      this._bot._moveType = 1;
      
    
    
  } else {
    return this.changeActionStateTo("approach");
  }
}

//--------------------------------------------------------------------------
// AI Pathfinding


// =============================================================================
//  Orange - Pathfinding
//  By Hudell - www.hudell.com
//  OrangePathfinding.js
//  Version: 1.0.1
//  Free for commercial and non commercial use.
// =============================================================================*/
//
// @plugindesc Faster Pathfinding for Rpg Maker MV <OrangePathfinding>
// @author Hudell
// 
// ============================================================================
//  Hudell's Plugins
//  ============================================================================
//  
// Check out my website:
//  http://hudell.com
//  
// =============================================================================*/
//_alias_Game_Event_updateSelfMovement = Game_Event.prototype.updateSelfMovement;
//Game_AIBot.prototype.updateSelfMovement = function() {
//  if (this._moveType === 7) {
//    if (this.inBattle()) {
//      if (!this._locked && this.isNearTheScreen() && this.checkStop(this.stopCountThreshold())) {
//        if (this.isCanPerformTeleportNow()) {
//          this.performTeleportToTarget();
//        }
 //       this._moveType = 2;
 //       return;
 //     }
 //   }
 // }
 // _alias_Game_Event_updateSelfMovement.call(this, arguments);
//};

var Imported = Imported || {};
var Hudell = Hudell || {};
Hudell.OrangePathfinding = Hudell.OrangePathfinding || {};

(function($) {
  Game_Character.prototype.getDirectionNode = function(start, goalX, goalY) {
    //console.log(start, goalX);
    //var goalXpx = goalX * 48;
    var searchLimit = this.searchLimit();
    var mapWidth = $gameMap.width();
    var nodeList = [];
    var openList = [];
    var closedList = [];
    var best = start;

    if (this.x === goalX && this.y === goalY) {
      return undefined;
    }

    nodeList.push(start);
    openList.push(start.y * mapWidth + start.x);

    while (nodeList.length > 0) {
      var bestIndex = 0;
     for (var i = 0; i < nodeList.length; i++) {
        if (nodeList[i].f < nodeList[bestIndex].f) {
          bestIndex = i;
        }
      }

      var current = nodeList[bestIndex];
      var x1 = current.x;
      //console.log(current);
      var y1 = current.y;
      var pos1 = y1 * mapWidth + x1;
      var g1 = current.g;

      nodeList.splice(bestIndex, 1);
      openList.splice(openList.indexOf(pos1), 1);
      closedList.push(pos1);

      if (current.x === goalX && current.y === goalY) {
        best = current;
        break;
      }

      if (g1 >= searchLimit) {
        continue;
      }

      for (var j = 0; j < 4; j++) {
        var direction = 2 + j * 2;

        var x2 = $gameMap.roundXWithDirection(x1, direction);
        var y2 = $gameMap.roundYWithDirection(y1, direction);

        var pos2 = y2 * mapWidth + x2;

        if (closedList.contains(pos2)) {
          continue;
        }
        if (!this.canPass(x1, y1, direction) && (x2 !== goalX || y2 !== goalY)) {
          continue;
        }

        var g2 = g1 + 1;
        var index2 = openList.indexOf(pos2);

        if (index2 < 0 || g2 < nodeList[index2].g) {
          var neighbor;
          if (index2 >= 0) {
            neighbor = nodeList[index2];
          } else {
            neighbor = {};
            nodeList.push(neighbor);
            openList.push(pos2);
          }
          neighbor.parent = current;
          neighbor.x = x2;
          neighbor.y = y2;
          neighbor.g = g2;
          neighbor.f = g2 + $gameMap.distance(x2, y2, goalX, goalY);

          if (!best || neighbor.f - neighbor.g < best.f - best.g) {
            best = neighbor;
          }
        }
      }
    }

    return best;
  };

  Game_Character.prototype.clearCachedNode = function() {
    this.setCachedNode();
  };

  Game_Character.prototype.setCachedNode = function(node, goalX, goalY) {
    this._cachedNode = node;
    this._cachedGoalX = goalX;
    this._cachedGoalY = goalY;
  };

  Game_Character.prototype.findDirectionTo = function(goalX, goalY) {
    if (this.x === goalX && this.y === goalY) {
      return 0;
    }

    if (this._cachedGoalX !== goalX || this._cachedGoalY !== goalY) {
      this.clearCachedNode();
    }

    var node = this._cachedNode;

    var start = {};
    start.parent = null;
    start.x = this.x;
    start.y = this.y;
    start.g = 0;
    start.f = $gameMap.distance(start.x, start.y, goalX, goalY);

    var canRetry = true;
    if (node === undefined) {
      node = this.getDirectionNode(start, goalX, goalY);
      this.setCachedNode(node, goalX, goalY);
      if (node === undefined) {
        return 0;
      }
      canRetry = false;
    }

    if (node.x !== start.x || node.y !== start.y) {
      while (node.parent && (node.parent.x !== start.x || node.parent.y !== start.y)) {
        node = node.parent;
      }

      if (!node.parent) {
        this.clearCachedNode();
        if (canRetry) {
          node = this.getDirectionNode(start, goalX, goalY);
          this.setCachedNode(node, goalX, goalY);
          if (node === undefined) {
            return 0;
          }
        }
      }
    }

    var deltaX1 = $gameMap.deltaX(node.x, start.x);
    var deltaY1 = $gameMap.deltaY(node.y, start.y);

    if (deltaY1 > 0) {
      return 2;
    } else if (deltaX1 < 0) {
      return 4;
    } else if (deltaX1 > 0) {
      return 6;
    } else if (deltaY1 < 0) {
      return 8;
    }

    var deltaX2 = this.deltaXFrom(goalX);
    var deltaY2 = this.deltaYFrom(goalY);
    var direction = 0;

    if (Math.abs(deltaX2) > Math.abs(deltaY2)) {
      direction = deltaX2 > 0 ? 4 : 6;
    } else if (deltaY2 !== 0) {
      direction = deltaY2 > 0 ? 8 : 2;
    }

    if (direction > 0) {
      if (!this.canPixelPass(this.px, this.py, direction)) {
        this.clearCachedNode();
        direction = 0;
      }
    }

    return direction;
  };

  Game_Character.prototype.searchLimit = function() {
    return 1;
  };

})(Hudell.OrangePathfinding);

Imported["OrangePathfinding"] = 1.0;

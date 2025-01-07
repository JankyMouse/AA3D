var Imported = Imported || {};
Imported.JM_AA3D = true;

var JM = JM || {};
JM.AA3D = JM.AA3D || {};
JM.AA3D.Version = 0.7;

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
*@text 3D Projectile Model?
*@parent options
*@desc Use 3D Models or 3D animated sprites for projectiles based on the "img" notetags setting.
*@type boolean
*@on 3D Model Projectiles
*@off 3D Sprites Projectiles
*@default true

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
*TODO:========================================================================
*Looking into importing particle shaders on models. Right now mv3d 
*doesn't recognize the shaders exported from Blender. May add the ability to 
*use custom particle systems via JSON file if I can't get that to work or if 
*the performance ends up being really bad.
*Still need to have the projectile change direction midflight (degreeToRad
*based off it's currect reference point) as it's wonky when you juke short
*ranged targeted attacks.
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
*Z Jumping is only fixed when using Midpass (QMovement setting) and Event
*priority to "Below Characters". 
*TODO:========================================================================
*Fix Event to Event and Event to Player collisions. Midpass doesn't work 
*correctly when using priority "Same as Characters" and causes AI to dance in 
*place.
*/

var JM_AA3D = JM.AA3D;
JM_AA3D.params = PluginManager.parameters("AA3D");

JM_AA3D.params = {
  _useWalkRunSkill: JSON.parse(JM_AA3D.params['_useWalkRunSkill']),
  _useFreeDir: JSON.parse(JM_AA3D.params['_useFreeDir']),
  _useProjectileModel: JSON.parse(JM_AA3D.params['_useProjectileModel']),
  _usePKDInventory: JSON.parse(JM_AA3D.params['_usePKDInventory'])
};

//JM.AA3D._useFreeDir = true; // Use 360 degree dir?
//JM.AA3D._projectileModel = true; //Use models for projectiles?
//(() => {
    //'use strict';

    //Input.keyMapper["66"] = "myOpenInventory";  // B

//})();

//mv3d.enumRenderGroups = {
//  BACK: 0, //1
 // MAIN: 0, //0
//  FRONT: 1 //2
 //};

const _Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
    //console.log("Wee")
    _Scene_Map_update.call(this);
    if(Input.isTriggered ("myOpenInventory")) PKD_MI.openOrCloseInventory(), 
      document.exitPointerLock();
    if($gamePlayer.isMoving()) $gamePlayer._checkPlayerIsCasting();
};


const _SceneManager_onSceneStart = SceneManager.onSceneStart;
SceneManager.onSceneStart = function() {
    //console.log("Wee")
    _SceneManager_onSceneStart.call(this);
    Input.keyMapper["66"] = "myOpenInventory";  // B
};


var _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
Scene_Map.prototype.onMapLoaded = function(){
  _Scene_Map_onMapLoaded.call(this);
  
  setTimeout(() => {
    $gamePlayer._absParams.battler._absParams.battleSkillsABS._skillsABS.forEach(m => {
      console.log(m.img);
      asyncImportModel(m.img); //Preload skill projectile models
    });
  }, "1000");

}

var _alias_Input__updateGamepadState = Input._updateGamepadState;
Input._updateGamepadState = function (gamepad) {
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


var _Scene_Map_processMapTouch = Scene_Map.prototype.processMapTouch;
Scene_Map.prototype.processMapTouch = function () {
   
    if (TouchInput.isTriggered() && JM_AA3D.params['_usePKDInventory'] && PKD_MI.isProcessEUITouch() === false || TouchInput.isTriggered() && !JM_AA3D.params['_usePKDInventory']) {var _Graphics$_canvas$req, _Graphics$_canvas$req2;
      // requestPointerLock isn't returning a promise ????
      (_Graphics$_canvas$req = Graphics._canvas.requestPointerLock()) === null || _Graphics$_canvas$req === void 0 ? void 0 : (_Graphics$_canvas$req2 = _Graphics$_canvas$req.catch) === null || _Graphics$_canvas$req2 === void 0 ? void 0 : _Graphics$_canvas$req2.call(_Graphics$_canvas$req, console.error);
    }
  }, () => !input_mv3d.isDisabled() && input_mv3d.inputCameraMouse && !input_mv3d._touchState.isTapped;

Scene_Map.prototype.processMapTouchCanceling = function () {
  // Override
}

//--------------------------------------------------------------------------------
// Game_Player MoveState / Model Action Logic

Game_Player.prototype.MoveStateActions = function(){
console.log($gamePlayer.mv3d_sprite.actions, "MoveStateActions started")
  this._inActionStopped = false;
  this._inActionMoving = false;
  this._inActionRunning = false;
  const commandName = "@p action play";
  //console.log(name)
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
Game_Player.prototype._performSkillMotion = function(){
  if(JM_AA3D.params['_useWalkRunSkill'] === true){
    console.log("Playerskill/item") //instant Player skills and items
    var Id = this._absParams.currentAction.skillId;
    //console.log(this);
    //this._cancelCastMotion();
    if(this._absParams.currentAction._isItem === true){
      var itemName = $dataItems[Id].name;
      JM.AA3D.actionName = itemName.toLowerCase();
      console.log("isItem", itemName)
        try{
          this.frameMax = this.mv3d_sprite.actions[JM.AA3D.actionName][0]._to;
          this._StartFrameCounter = true;
          this.MoveStateActions();
        }catch(error){
          console.warn("Item", '"' + [JM.AA3D.actionName] + '"',
          "is missing a corresponding model action @",
          this.mv3d_sprite.spriteOrigin._children[0].model_key.replace(/.\/models\/|0|\|/g,""));
        }
      }else if(this._absParams.casting === false){
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
    this._attackDir = this._mv3d_data.direction;
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
    var name = this.castingName
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
    var skillId = this.battler()._absParams.battleSkillsABS._skillsABS[0].skillId;
    console.log(this._eventId, "Enemy Ev Id");
    console.log($dataSkills[skillId].name,"Enemy Skill");
    console.log(this)
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
  if(JM_AA3D.params['_useWalkRunSkill'] === true){
    if (this._absParams._inCastMotion === false) { //TRUE??
      var skillId = this.battler()._absParams.battleSkillsABS._skillsABS[0].skillId;
      var commandName = "@e" + this._eventId + " action stop";
      var name = $dataSkills[skillId].name;
      mv3d.command(commandName,name);
    }
    return this._absParams._inCastMotion = false;
  }else{
    return _Game_AIBot__cancelCastMotion.call(this);
  }
};

//--------------------------------------------------------------------------------
// Game_AIBot Skills / Model Action

var _Game_AIBot__performSkillMotion = Game_AIBot.prototype._performSkillMotion;
Game_AIBot.prototype._performSkillMotion = function(){
  if(JM_AA3D.params['_useWalkRunSkill'] === true){
    if(this._absParams._inCastMotion === true){
      var skillId = this.battler()._absParams.battleSkillsABS._skillsABS[0].skillId;
      var commandName = "@e" + this._eventId + " action play"
      var name = $dataSkills[skillId].name;
      mv3d.command(commandName,name,"important");
      return console.log("SkillMotionSuccEn");
    }
  }else{
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

Game_AIBot.prototype.performTeleportToPoint = function (point) {
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

const _char_jump = Game_CharacterBase.prototype.jump;
Game_CharacterBase.prototype.jump = function (xPlus, yPlus) {
  if (mv3d.isDisabled()) {return _char_jump.apply(this, arguments);}

  this.mv3d_jumpHeightStart = this.z != null ? this.z : this.canPass(BaseX, BaseY);
  this.mv3d_jumpHeightEnd = this.mv3d_jumpHeightStart;
  //_char_jump.apply(this, arguments);
  this._x += xPlus;
  this._y += yPlus;
  var distance = Math.round(Math.sqrt(xPlus * xPlus + yPlus * yPlus));
  this._jumpPeak = 10 + distance - this._moveSpeed;
  this._jumpCount = this._jumpPeak * 2;
  this.resetStopCount();
  this.straighten();
};

//--------------------------------------------------------------------------------
// Game_Player: Jump / 8dir fix

Game_Player.prototype.jump = function (xPlus, yPlus) {
  const BaseX = this.x, BaseY = this.y;
  console.log(this.canPass)
  // Jump destination canPass()?
  if(this.canPass(BaseX, BaseY) && this.canPass(BaseX - 1, BaseY) &&
    this.canPass(BaseX, BaseY - 1) && this.canPass(BaseX + 1, BaseY) &&
    this.canPass(BaseX, BaseY + 1) && this.canPass(BaseX - 1, BaseY - 1) &&
    this.canPass(BaseX + 1, BaseY - 1) && this.canPass(BaseX + 1, BaseY + 1) &&
    this.canPass(BaseX - 1, BaseY + 1) === true){
      switch(this._mv3d_data.direction){
        case(2): console.log("2"); xPlus = 0; yPlus = 1; break; // DOWN
        case(4): console.log("4"); xPlus = -1; yPlus = 0; break; // LEFT
        case(6): console.log("6"); xPlus = 1; yPlus = 0; break; // RIGHT
        case(8): console.log("8"); xPlus = 0; yPlus = -1; break; // UP
        case(1): console.log("1"); xPlus = -1; yPlus = 1; break; // DOWN LEFT
        case(3): console.log("3"); xPlus = 1; yPlus = 1; break; // DOWN RIGHT
        case(7): console.log("7"); xPlus = -1; yPlus = -1; break; // UP LEFT
        case(9): console.log("9"); xPlus = 1; yPlus = -1; break; // UP RIGHT
      }
      //var Id = this.direction();
      //this.setDirection(2);
    }else{ 
      // Cannot jump to destination safely / jump in place
      console.log("ELSE", this);
      xPlus = 0;
      yPlus = 0;
    }
  Game_Character.prototype.jump.call(this, xPlus, yPlus);
};

//--------------------------------------------------------------------------------
// Game_Character AI: Impulse (knockback) / Z collision fix

Game_Character.prototype.onApplyImpulseForce = function (x, y, d) {
  if ((x === 1 || x === -1 || x === 0) && (y === 1 || y === -1 || y === 0)) {
    console.log(x,y,d)
    console.log("ImpulseForce")
    const BaseX = this.x, BaseY = this.y;
    // Jump destination canPass()?
    if(this.canPass(BaseX, BaseY) && this.canPass(BaseX - 1, BaseY) &&
      this.canPass(BaseX, BaseY - 1) && this.canPass(BaseX + 1, BaseY) &&
      this.canPass(BaseX, BaseY + 1) && this.canPass(BaseX - 1, BaseY - 1) &&
      this.canPass(BaseX + 1, BaseY - 1) && this.canPass(BaseX + 1, BaseY + 1) &&
      this.canPass(BaseX - 1, BaseY + 1) === true){
        switch($gamePlayer._attackDir){
          case(2): xPlus = 0; yPlus = 1; break; // DOWN
          case(4): xPlus = -1; yPlus = 0; break; // LEFT
          case(6): xPlus = 1; yPlus = 0; break; // RIGHT
          case(8): xPlus = 0; yPlus = -1; break; // UP
          case(1): xPlus = -1; yPlus = 1; break; // DOWN LEFT
          case(3): xPlus = 1; yPlus = 1; break; // DOWN RIGHT
          case(7): xPlus = -1; yPlus = -1; break; // UP LEFT
          case(9): xPlus = 1; yPlus = -1; break; // UP RIGHT
        }
      //var Id = this.direction();
      //this.setDirection(2);
    }else{ 
      // Cannot jump to destination safely / jump in place
      console.log("ELSE", this);
      xPlus = 0;
      yPlus = 0;
    }
    //xPlus = x, yPlus = y;
    //this.jump(xPlus, yPlus);
    Game_Character.prototype.jump.call(this, xPlus, yPlus);
    } else {
      this._onComplexImpulse(x, y, d);
  }
};

//--------------------------------------------------------------------------------
// Game_Character: AI Complex Impulse (knockback >1) / Z collision fix

Game_Character.prototype._onComplexImpulse = function (x, y, d) {
  console.log(x,y,d);
  const BaseX = this.x, BaseY = this.y;
  const impulse = $gamePlayer._absParams.currentAction.impulse;
  console.log(impulse)
  // Jump destination canPass()? Needs impulse var for 1.
  if(this.canPass(BaseX, BaseY) && this.canPass(BaseX - impulse, BaseY) &&
    this.canPass(BaseX, BaseY - impulse) && this.canPass(BaseX + impulse, BaseY) &&
    this.canPass(BaseX, BaseY + impulse) && this.canPass(BaseX - impulse, BaseY - impulse) &&
    this.canPass(BaseX + impulse, BaseY - impulse) && this.canPass(BaseX + impulse, BaseY + impulse) &&
    this.canPass(BaseX - impulse, BaseY + impulse) === true){
      switch($gamePlayer._attackDir){
        case(2): xPlus = 0;         yPlus = impulse; break; // DOWN
        case(4): xPlus = - impulse; yPlus = 0; break; // LEFT
        case(6): xPlus = impulse;   yPlus = 0; break; // RIGHT
        case(8): xPlus = 0;         yPlus = - impulse; break; // UP
        case(1): xPlus = - impulse; yPlus = impulse; break; // DOWN LEFT
        case(3): xPlus = impulse;   yPlus = impulse; break; // DOWN RIGHT
        case(7): xPlus = - impulse; yPlus = - impulse; break; // UP LEFT
        case(9): xPlus = impulse;   yPlus = - impulse; break; // UP RIGHT
      }
    //var Id = this.direction();
    //this.setDirection(2);
  }else{ 
  // Cannot jump to destination safely / jump in place
  //console.log("ELSE", this);
  xPlus = 0;
  yPlus = 0;
  }
  Game_Character.prototype.jump.call(this, xPlus, yPlus);
};

//Game_Character / Game_AI Self/Player Collisions (Same as Character Prio)

Game_CharacterBase.prototype.collisionCheck = function(x, y, dir, dist, type) {

  this.collider(type).moveTo(x, y);
  if (!this.valid(type)) return false;
  if (this.isThrough() || this.isDebugThrough()) return true;
  var d = dir;
  //Midpass is falsy for enemies and not falling through to true when removing midpass either.
  if ($gameMap.midPass() && dir !== 5 && (mv3d.getTileConfig(x/48,y/48).height != undefined)) {
    if (!this.middlePass(x, y, dir, dist, type)) return false; //Force return true
  }

  if (this.collidesWithAnyTile(type)) return false;
  if (this.collidesWithAnyCharacter(type)&& (mv3d.getTileConfig(x/48,y/48).height != undefined)) return false;
  //if (checkPlusMinusOne(this.x, $gamePlayer.x) && checkPlusMinusOne(this.y, $gamePlayer.y) === true) return false;
  //console.log(this.z, mv3d.getTileConfig((~~x/48),(~~y/48)).height);
  //console.log(this, "AI")
  //console.log(checkPlusMinusOne(~~$gamePlayer.x, ~~Game_AIBot.x))
  return true;
};

//Game_CharacterBase.prototype.collisionCheck = function(x, y, dir, dist, type) {

//  function checkPlusMinusOne(variable, target) {
 //   return (
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

Game_Player.prototype.AA3DfreeDirection = function (X, Y, rad) {
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

Game_Player.prototype._findEndPointForVectorSkill = function () {
  var absSkill;
  absSkill = this._absParams.currentAction;
  if (absSkill.isFreeDirection()) {
    if (JM_AA3D.params['_useFreeDir'] === true) {
      this.AA3DfreeDirection(this.x, this.y, 10); // Add radius adjustment?
      var point = new KDCore.Point(this._attackX, this._attackY);
    }else{
      x = this.x, y = this.y;
      switch ($gamePlayer._attackDir) {
        case(2): console.log("2"); x += 0;  y += 1; break; // DOWN
        case(4): console.log("4"); x += -1; y += 0; break; // LEFT
        case(6): console.log("6"); x += 1;  y += 0; break; // RIGHT
        case(8): console.log("8"); x += 0;  y += -1; break; // UP
        case(1): console.log("1"); x += -1; y += 1; break; // DOWN LEFT
        case(3): console.log("3"); x += 1;  y += 1; break; // DOWN RIGHT
        case(7): console.log("7"); x += -1; y += -1; break; // UP LEFT
        case(9): console.log("9"); x += 1;  y += -1; break; // UP RIGHT
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

// Projectile Dispose ------------------------------------------------------------

AlphaABS.LIBS.Game_SVector.prototype.dispose = function () {
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

// Projectile Starting Point ------------------------------------------------------

AlphaABS.LIBS.Game_SVector.prototype._startPoint = function () {
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

// Projectile Vector Logic --------------------------------------------------------

AlphaABS.LIBS.Game_SVector.prototype._imageToPoint = function () {
  //console.log("IMAGETOPOINT", this._data);
  if (this._myPoint == null)
    return;

  var x = this._myPoint._x;
  var y = this._myPoint._y;

  this.sprite.x = -1000;
  this.sprite.y = 0;
  //console.log(this._imageSpr._frame.x);
  //console.log(this._imageSpr._frameCount);
  //console.log(this._imageSpr._bitmap.__baseTexture.realWidth);
  //console.log(this._imageSpr._animIndex);
  //console.log(this._imageSpr);
  if ((JM_AA3D.params['_useProjectileModel'] === true) || (JM.AA3D[$gamePlayer] != null)) {
    this.projectile.setEnabled(true);
    this.rotDir = (this._data.subject._mv3d_data.blenders.direction) * Math.PI / 180 * -1 + Math.PI / 2;
    console.log(this._imageSpr.parent.rotation);
  } else { // No Model Loaded
    try{
      this.texture.uOffset = this._imageSpr._texture._uvs.x1;
    }catch{
      this.texture.uOffset = 0;
    }
  }
  //this._data.skill.freeDirection === 1 &&
  if (JM_AA3D.params['_useProjectileModel']) {
    this.projectile.rotation = new BABYLON.Vector3(this.rotDir2, this.rotDir, 0);
    //console.log(this.projectile)
  } else {
    this.projectile.rotation = new BABYLON.Vector3(Math.PI/2, this.rotDir, 0);
  }
  //plane.rotation.x = BABYLON.Tools.ToRadians(90)
  if (this._data.target.toPoint) {
    this.projectile.position.x = x;
    this.projectile.position.z = (y * -1);
    this.projectile.position.y = + 0.5;
    //console.log("THIS", this._data.subject);
  }
};

// Projectile Endpoint (May use this to switch to an ending animation action)

AlphaABS.LIBS.Game_SVector.prototype._endPoint = function () {
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

// Projectile Model Async Loader -------------------------------------------------------

//asyncImportModel = async function (imgName) {  
//  let result = await BABYLON.SceneLoader.ImportMeshAsync(null, "./models/", imgName + ".glb", mv3d.scene) 
//  result.meshes[0].setEnabled(false); // Set preloaded models to disabled until used and refreshed.
//  //animationGroups[1].start(true);
//  JM.AA3D[imgName] = result.meshes[0];
//};



asyncImportModel = async function (imgName) {  
  let sphereSpark = await BABYLON.MeshBuilder.CreatePlane("sphereSpark", {width: 1, height: 1}, mv3d.scene);
	sphereSpark.isVisible = false;
  
  await BABYLON.ParticleHelper.ParseFromSnippetAsync("EXUQ7M#5", mv3d.scene, true).then(function(system) {
    system.minScaleX = 0.5;
    system.minScaleY = 0.5;
    system.maxScaleX = 0.5;
    system.maxScaleY = 0.5;
   
    system.preWarmCycles = 200;
    system.emitter = sphereSpark; 
    system.minEmitBox = new BABYLON.Vector3(0, 0, 0);
    system.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
    //system.maxEmitPower = 10;
    system.updateSpeed = 0.1;
    system.emitRate = 5;
    system.renderingGroupId = mv3d.enumRenderGroups.MAIN;
    system.needDepthPrePass = true;
    });
    //await BABYLON.ParticleHelper.ParseFromSnippetAsync("UY098C#501", mv3d.scene, true).then(function(system) {
    //  system.minScaleX = 0.5;
    //  system.minScaleY = 0.5;
    //  system.maxScaleX = 0.5;
    //  system.maxScaleY = 0.5;
    //  system.minEmitBox = new BABYLON.Vector3(0, 0, 0);
    //  system.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
    //  system.preWarmCycles = 200;
    //  system.emitter = sphereSpark;
    //  //system.maxEmitPower = 10;
    //  system.updateSpeed = 0.1;
    //  system.emitRate = 5;
    //  system.renderingGroupId = mv3d.enumRenderGroups.MAIN;
    //  system.needDepthPrePass = true;
    //  });
  JM.AA3D[imgName] = sphereSpark;
};

// Projectile Set Sprite and/or Model ------------------------------------------------

AlphaABS.LIBS.Game_SVector.prototype._setImage = function (name) {
  const scene = mv3d.scene;
  if (name) {
    var imgSpr;
    if (name == 'null') {
      console.log("name is not defined???????")
      this.name = false;
      imgSpr = new Sprite(AlphaABS.DATA.IMG.Vector.bitmap);
      V4 = new BABYLON.Vector4(0, 0, 1, 1);
      this.texture = new BABYLON.Texture(AlphaABS.DATA.IMG.Vector.bitmap._url, scene);
      this.rotDir = (this._data.subject._mv3d_data.blenders.direction) * Math.PI / 180 * -1 + Math.PI / 2;
      this.rotDir2 = Math.PI / 2;
      projectile = BABYLON.MeshBuilder.CreatePlane("proj", {width: 1, height: 1, sideOrientation: BABYLON.Mesh.DOUBLESIDE, frontUVs: V4, backUVs: V4, wrap: true}, scene);
      this.projectile = projectile;
      const material = new BABYLON.StandardMaterial("material", scene);
      //material.diffuseColor = new BABYLON.Color3(1,1,1);
      material.backFaceCulling = true;
      material.twoSidedLighting = true;
      material.alphaCutOff = mv3d.ALPHA_CUTOFF;
      material.diffuseTexture = this.texture;
      material.diffuseTexture.hasAlpha = true;
      material.ambientColor.set(1,1,1);
      material.specularColor.set(1,1,1);
      material.maxSimultaneousLights = 25;
      this.projectile.material = material;
      //console.log(AlphaABS.DATA.IMG.Vector.bitmap, "FLAG");
    } else {
      //console.log("name is defined!!!!!!!");
      if (!JM_AA3D.params['_useProjectileModel']) {
        imgSpr = new AlphaABS.LIBS.Sprite_Vector(name);
        this.texture = new BABYLON.Texture(imgSpr._bitmap.url, scene);
        this.rotDir = (this._data.subject._mv3d_data.blenders.direction) * Math.PI / 180 * -1 + Math.PI / 2;
      } else {
        imgSpr = new Sprite();
        this.rotDir = (this._data.subject._mv3d_data.blenders.direction) * Math.PI / 180 * -1;
        //console.log(imgSpr, "REEEE");
      }
      this.rotDir2 = 0;
      V4 = new BABYLON.Vector4(0,0, 1 / imgSpr._frameCount, 1);
      this.name = true;
      //console.log(imgSpr._frameCount)
      if (JM_AA3D.params['_useProjectileModel']) { // && JM.AA3D[$gamePlayer._absParams.currentAction.img] != undefined
        this.projectile = JM.AA3D[$gamePlayer._absParams.currentAction.img];
        asyncImportModel($gamePlayer._absParams.currentAction.img);
        //console.log(JM.AA3D[$gamePlayer._absParams.currentAction.img])
      } else {
        //console.log("SHOULD BE FLAGGING");
        projectile = BABYLON.MeshBuilder.CreatePlane("proj", {width: 1, height: 1, sideOrientation: BABYLON.Mesh.DOUBLESIDE, frontUVs: V4, backUVs: V4, wrap: true}, scene);
        const material = new BABYLON.StandardMaterial("material", scene);
        //material.diffuseColor = new BABYLON.Color3(1,1,1);
        material.backFaceCulling = true;
        //material.twoSidedLighting = true;
        material.alphaCutOff = mv3d.ALPHA_CUTOFF;
        material.diffuseTexture = this.texture;
        material.diffuseTexture.hasAlpha = true;
        material.ambientColor.set(1,1,1);
        material.specularColor.set(1,1,1);
        material.maxSimultaneousLights = 25;
        projectile.material = material;
        this.projectile = projectile;
       }
    }
    this._imageSpr = imgSpr;
    this.sprite = new Sprite();
    this.sprite.addChild(imgSpr);
    console.log(this);

  } else {
    this._imageSpr = new Sprite(); // * Empty?
    this.sprite = new Sprite(new Bitmap(76, 38));
    //console.log("DONT FLAG")
  }
};

//--------------------------------------------------------------------------
// AI Pathfinding

Game_Character.prototype.moveFromPoint = function (point) {
  var points = [];
  for (var j = 0; j < 4; j++) {
    var direction = this._mv3d_data.direction;
    if (this.canPass(this.x, this.y, direction)) {
      var x2 = $gameMap.roundXWithDirection(this.x, direction);
      var y2 = $gameMap.roundYWithDirection(this.y, direction);
        //if(x2 != point.x && y2 != point.y)
          points.push([x2, y2]);
    }
  }

  if (points.length > 0) {
    //LOG.p("POINTS " + points.length);
    var p;
    if (points.length > 1)
      p = points.sample();
      else
        p = points[0];
        var newPoint = {
          x: p[0],
          y: p[1]
        };
        this.moveToPointAA(newPoint);
  }
};

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
var Imported = Imported || {};
var Hudell = Hudell || {};
Hudell.OrangePathfinding = Hudell.OrangePathfinding || {};

(function($) {
  "use strict";
  Game_Character.prototype.getDirectionNode = function(start, goalX, goalY) {
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
      if (!this.canPass(this._x, this._y, direction)) {
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
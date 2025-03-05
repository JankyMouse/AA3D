MV3D V0.9.2.8 Premium (by Cutievirus/Ella), AlphaABS V1250 [PRO] (by Kage Desu), and QMovement V1.6.3 (by Quxios) compatibility and feature expansion patch:

This patch aims to fix all the major hang ups whether it be combat, combat smoothness, combat making enemies fly up into the ether.., mouse interfacing, gamepad interfacing, skill interfacing, model animations for skills and items, collision fixes and AI pathfinding performance improvements.

Intended Plugin Order:<br>
QMovement<br>
MV3D<br>
UniformCameraPlayerFace (Optional but built with it in mind)<br>
AlphaABS<br>
AA3D

Documentation:<br>
MV3D - https://cutievirus.com/docs/mv3d/#getting-started<br>
AlphaABS - https://github.com/KageDesu/Alpha-ABS/wiki<br>
QMovement - https://quxios.github.io/plugins/QMovement

CrossFeatures:<br>
Automatic 3D actions for ABS Skills and Items<br>
Added handling for 3D model actions for all ABS Skills and Items. Game Player + Game AI (Use automatic 3D actions) With this enabled, all of your ABS skills/items will switch actions based on skills used and movestate (for smooth animations/remedies "iceskating" models when using actions while moving) Just add 3 actions (NLATracks/With matching frames of the actual skill  animation like swinging a sword) to your model per skill/item with the same name as your skill or weapon and append 2 of them with walk and run respectively. i.e. Attack, Attackwalk, Attackrun

3D Model/Sprite/3D Particle Projectiles:<br>
Added handling for 3D model(Experimental), 3D sprite, or 3D particle projectiles. Just plug the name of your projectile model (that goes in your "Models" folder) into <img:> skill parameter n your skill/weapon notetags. For models, AA3D will  use the first NLA track and loop it.<br>

For sprites, AA3D will project a flat sprite into the 3D space and setup is the same as it's original behavior. Append "_frames" to the img name to define the amount of animation frames. i.e. <img:Attack_3> where 3 means it has 3 frames of animation. The file for sprite mode still needs to go in "Pictures" folder.<br>

(Added Ver 0.9)<br>
For particles, you can use the particle editor here https://playground.babylonjs.com/#M7MYT8#11 and then save the particle system to a JSON file. Save it to a "particles" folder in the root directory of your game (same place the mv3d folder is). Then, "edit" the associated textures for the particle system so you can save them to the particles folder aswell. Make sure the JSON file and texture has the same name. Finally, define which weapons or skills you want to add the particle projectile with the <img> notetag in the datebase. Once you get comfortable with the editor, you can open the JSON file to study the formatting to make more advanced custom particle systems.<br>

(Added Ver 0.9)<br>
Define projectile type with the <projectile> note tag in the weapons or skills database. (i.e <projectile:model>, <projectile:sprite>, or <projectile:particle>)
Weapons and skills will default to the value selected in plugin options if not defined with a notetag.

Adaptations:<br>
<freeDirection:1> Skill Note tags have been adapted to use the direction your character is facing (360 degree attacking) or 8 Dir aiming to use freeDirection as a patch for 8 direction attacks. (These are specifically 
added for use with my UniformCameraPlayerFace extension for MV3D but either will work still without it) TODO: Patch original use case (aim skills based on Clicking on the map) + be able to use both.

TODO<br>
Will be adding more mouse modes (Current behavior: Right click releases the mouse and left click locks the mouse camera again)

Compatibility & Performance:<br>
Pathfinding<br>
Integrated OrangePathFinding by Hudell. Necessary performance and enemy diagonal pathing fix.

Collision Fixes & Z Jumping Bug Fix for QMovement:<br>
Various collision fixes added for Game Player and Game AI Jumping, Impulse Actions (Knockbacks), and complex Impulse Actions (Knockbacks greater than 1).

Player to Event, Player to AI, AI to Event, and AI to AI collision fixes for "Same as Player" priority.
TODO<br>
Dancing in place has been fixed but there is still an issue that can cause AI to slip under the player if trying to pass downwards on a slope and get stuck in the AI. Adjusting mv3d:scale() is a decent workaround for now as it adjusts the colliders as well.. Still trying to sort that out as I'm pretty sure there's at least 2 collision systems working on top of eachother to a certain extent still. But ya, basically it's because of the slope. Tilting the tile causes the distance to shorten obviously. Then it thinks it's not colliding yet based on distance but it's already in the middle of the AIs collider by the time the collision check fires.

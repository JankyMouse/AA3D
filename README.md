MV3D V0.9.2.7 Premium (by Cutievirus/Ella), AlphaABS V1250 [PRO] (by Kage Desu), and QMovement V1.6.3 (by Quxios) compatibility and feature expansion patch.

Finally got mostly everything working. This patch aims to fix all the major hang ups whether it be combat, combat smoothness, combat making enemies fly up into the ether.., mouse interfacing, gamepad interfacing, skill interfacing, model animations for skills and items and probably a bunch of other stuff I'm forgetting. I think I've got the patch into a workable enough state to release a beta so peeps can tinker with it if they want. There's a couple things that still need some time to cook. I will post again soon when I make some more progress and try to do some kind of setup video. Working on getting some public repos up so all my stuff can be found.

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

3D Model/Sprite Projectiles:<br>
Added handling for 3D model(Experimental) or 3D sprite projectiles. Just plug the name of your projectile model (that goes in your "Models" folder) into <img:> skill parameter n your skill/weapon notetags. For models, AA3D will  use the first NLA track and loop it. For sprites, AA3D will project a flat  sprite into the 3D space and setup is the same as it's original behavior. Append "_frames" to the img name to define the amount of animation frames. i.e. <img:Attack_3> where 3 means it has 3 frames of animation. The file for sprite mode still needs to go in "Pictures" folder.
TODO<br>
Looking into importing particle shaders on models. Right now mv3d doesn't recognize the shaders exported from Blender. May add the ability to use custom particle systems via JSON file if I can't get that to work or if 
the performance ends up being really bad. Still need to have the projectile change direction midflight (degreeToRad based off it's correct reference point) as it's wonky when you juke short ranged targeted attacks.

Adaptations:<br>
<freeDirection:1> Skill Note tags have been adapted to use the direction your character is facing (360 degree attacking) or 8 Dir aiming to use freeDirection as a patch for 8 direction attacks. (These are specifically 
added for use with my UniformCameraPlayerFace extension for MV3D but either will work still without it) TODO: Patch original use case (aim skills based on Clicking on the map) + be able to use both.

TODO<br>
Will be adding more mouse modes (Current behavior: Right click releases the mouse and left click locks the mouse camera again)

Compatibility & Performance:<br>
Pathfinding<br>
Integrated OrangePathFinding by Hudell. Necessary performance and enemy diagonal pathing fix.

Collision Fixes & Z Jumping Bug Fix for QMovement:<br>
Various collision fixes added for Game Player and Game AI Jumping, Impulse Actions (Knockbacks), and complex Impulse Actions (Knockbacks greater than 1). Z Jumping is only fixed when using Midpass (QMovement setting) and Event priority to "Below Characters".
TODO<br>
Fix Event to Event and Event to Player collisions. Midpass doesn't work correctly when using priority "Same as Characters" and causes AI to dance in place.

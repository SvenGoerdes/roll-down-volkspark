import { PLAYER_Z, WALLS_PER_SEASON, SEASONS, POWERUPS, TOUR_LANDMARKS, GALLERY_PLANT_BEHIND, PLANT_BEHIND_LANDMARKS, VOLKSPARK_LANDMARK_FROM, VOLKSPARK_LANDMARK_EVERY } from './config.js';
import { seasonAhead, widened, seasonIndexAt, landmarkAt, volksparkLandmarkAt, plantDepth } from './logic.js';
import { drawBackground, drawGround, drawHorizon, drawWall, drawPuddle, drawPickup } from './render.js';
import { drawSyringe, drawSyringeImpact } from './render-syringes.js';
import { drawPlayer } from './render-player.js';
import { poseFor } from './figure.js';
import { drawScenery, drawParticles, drawSpeedLines, drawGrade, drawFx } from './render-fx.js';
import { drawIceSheen, drawSkidMarks, drawSpray } from './render-slip.js';
import { sceneryAt } from './scenery.js';
import { recordGoal, recordWall } from './scoring.js';
import { drawRecordMark } from './render-record.js';
import { t as tr } from './i18n.js';
import { drawGate } from './render-gate.js';
import { drawGallery } from './render-gallery.js';
import { drawOberbaum } from './render-oberbaum.js';
import { drawReichstag } from './render-reichstag.js';
import { drawRathaus } from './render-rathaus.js';

const drawList = [];
const byDepth = (a, b) => b.depth - a.depth;

// The landmark a wall shows, or null for the gabion wall: Berlin-Tour every wall, Volkspark every Nth from autumn.
// Without loaded sprites it stays a gabion wall.
function landmarkFor(game, wall, sprites) {
  if (!sprites) return null;
  if (game.theme === 'berlin-tour') return landmarkAt(wall.index, TOUR_LANDMARKS, WALLS_PER_SEASON);
  return volksparkLandmarkAt(wall.index, VOLKSPARK_LANDMARK_FROM, VOLKSPARK_LANDMARK_EVERY, TOUR_LANDMARKS, WALLS_PER_SEASON);
}

export function renderScene(ctx, view, game, state, figure, backgrounds, groundTiles, powerIcons, gateSprites) {
  const s = SEASONS[game.seasonIdx];
  const prev = game.prevSeasonIdx !== null ? SEASONS[game.prevSeasonIdx] : null;
  ctx.save();
  if (game.shake > 0) {
    const m = game.shake * 14;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }
  drawBackground(ctx, view, backgrounds[s.id], prev && backgrounds[prev.id], game.seasonFade, game.player.x);
  // Berlin-Tour has its own scrolling ground; Volkspark keeps the old one (#75).
  const berlinGround = game.theme === 'berlin-tour' && groundTiles?.['berlin-tour'];
  drawGround(ctx, view, s, game.travelled, game.surfaceAt, berlinGround || groundTiles?.volkspark, berlinGround ? 1 : 0);
  drawHorizon(ctx, view, s, prev, game.seasonFade, game.player.x);
  if (s.id === 'winter') drawIceSheen(ctx, view, game.travelled, game.seasonFade);
  drawSkidMarks(ctx, view, game.skids, s.id === 'winter');

  const speed = game.speed;
  const ahead = seasonAhead(game.walls, game.seasonIdx, WALLS_PER_SEASON, SEASONS.length);
  const showPlayer = figure && state !== 'start';
  const mode = { intro: 'intro', over: 'dazed' }[state] ?? 'roll';
  const t = mode === 'intro' ? game.introT : game.time - game.crashAt;
  const pose = showPlayer ? poseFor({ mode, t, spin: game.player.spin, helmet: game.player.helmets > 0 }, figure) : null;
  const look = { s, aheadZ: ahead.z, aheadId: SEASONS[ahead.idx].id, speed, widen: game.effects.widen > 0 ? 1.6 : 1, pose };
  const goal = state === 'playing' ? recordGoal(game.passed, game.best, game.worldBest) : null;
  look.record = goal ? recordWall(game.walls, game.passed, goal.target, PLAYER_Z) : null;
  look.recordLabel = tr(goal?.world ? 'record.worldSign' : 'record.ownSign');
  drawList.length = 0;
  const galleryZ = game.walls.filter((w) => PLANT_BEHIND_LANDMARKS.includes(landmarkFor(game, w, gateSprites))).map((w) => w.z);
  for (const o of sceneryAt(game.travelled)) {
    o.layer = 'plant'; o.depth = plantDepth(o.z, galleryZ, GALLERY_PLANT_BEHIND); drawList.push(o);
  }
  for (const o of game.puddles) { o.layer = 'puddle'; o.depth = o.z + 0.01; drawList.push(o); }
  for (const o of game.walls) { o.layer = 'wall'; o.depth = o.z; drawList.push(o); }
  for (const o of game.syringes) { o.layer = 'syringe'; o.depth = o.z; drawList.push(o); }
  for (const o of game.pickups) { o.layer = 'pickup'; o.depth = o.z; drawList.push(o); }
  // The crashed wall stays behind the player so the dazed pose remains visible.
  for (const w of game.walls) if (w.broken) w.depth = PLAYER_Z + 0.5;
  if (showPlayer) {
    game.player.layer = 'player';
    game.player.depth = PLAYER_Z - 0.001;
    drawList.push(game.player);
  }
  drawList.sort(byDepth);
  for (const o of drawList) {
    switch (o.layer) {
      case 'plant': drawScenery(ctx, view, o, o.z > look.aheadZ ? look.aheadId : look.s.id); break;
      case 'puddle': drawPuddle(ctx, view, o); break;
      case 'wall': {
        const gaps = look.widen > 1 ? o.gaps.map((g) => widened(g, look.widen)) : o.gaps;
        const wallSeason = SEASONS[seasonIndexAt(o.index, WALLS_PER_SEASON, SEASONS.length)];
        const id = landmarkFor(game, o, gateSprites);
        if (id) {
          if (id === 'east-side-gallery') drawGallery(ctx, view, o, gaps, gateSprites[id]);
          else if (id === 'oberbaum-bridge') drawOberbaum(ctx, view, o, gaps, gateSprites[id]);
          else if (id === 'reichstag') drawReichstag(ctx, view, o, gaps, gateSprites[id]);
          else if (id === 'red-town-hall') drawRathaus(ctx, view, o, gaps, gateSprites[id]);
          else drawGate(ctx, view, o, gaps, wallSeason, gateSprites[id]);
        } else drawWall(ctx, view, o.z, gaps, wallSeason);
        if (o === look.record) drawRecordMark(ctx, view, o, look.recordLabel);
        break;
      }
      case 'syringe': drawSyringe(ctx, view, o); break;
      case 'pickup': drawPickup(ctx, view, o, POWERUPS[o.type], game.time, powerIcons[o.type]); break;
      default: drawPlayer(ctx, view, o, game.time, state === 'playing' ? look.speed : 0, figure, look.pose, state === 'playing' ? game.effects.superattack : 0);
    }
  }
  drawSpray(ctx, game.spray);
  drawParticles(ctx, game.particles);
  if (state === 'playing') drawSpeedLines(ctx, view, look.speed, game.time);
  drawGrade(ctx, view, s, prev, game.seasonFade);
  drawFx(ctx, game.fx);
  if (game.effects.slowmo > 0) {
    ctx.fillStyle = 'rgba(80,120,255,0.12)';
    ctx.fillRect(0, 0, view.W, view.H);
  }
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255,40,40,${game.flash * 0.6})`;
    ctx.fillRect(0, 0, view.W, view.H);
  }
  drawSyringeImpact(ctx, view, game.player, game.syringeImpact);
  ctx.restore();
}

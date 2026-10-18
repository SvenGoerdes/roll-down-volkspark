"""Pure pose and bottle tables for the isolated 45-frame Blender review intro."""
import math

FPS = 30
N = 45
CONTACT = 18
TUCK = 35
BOTTLE_SCALE = 2.8

STAND = dict(shy_l=-8, shy_r=-8, sh_l=3, sh_r=3)
STEP = dict(hp_r=28, kn_r=-25, hp_l=-8, sh_l=22, sh_r=-18, shy_l=-8, shy_r=-8,
            el_l=15, el_r=10, fwd=0.05)
CATCH = dict(bend=-15, nod=15, hp_r=12, kn_r=-8, hp_l=-20, kn_l=-20, sh_l=45, sh_r=40,
             shy_l=-20, shy_r=-20, el_l=20, el_r=20, pitch=-12, fwd=0.14)
TRIP = dict(bend=-20, nod=10, sh_l=-35, shy_l=55, sh_r=50, shy_r=35, el_l=35, el_r=40,
            hp_l=-30, kn_l=-35, hp_r=20, kn_r=-10, pitch=-18, fwd=0.25)
FLAIL = dict(bend=-25, nod=20, sh_l=150, shy_l=45, sh_r=110, shy_r=60, el_l=25, el_r=45,
             hp_l=-45, kn_l=-70, hp_r=15, kn_r=-30, pitch=-40, fwd=0.5, lift=0.15)
TUCK_POSE = dict(bend=-45, nod=-25, sh_l=60, sh_r=60, shy_l=10, shy_r=10, el_l=-50, el_r=-50,
                 hp_l=80, hp_r=80, kn_l=-110, kn_r=-110, pitch=-70, fwd=0.85, lift=0.3)
BALL_HUMAN = dict(bend=-60, nod=-40, sh_l=35, sh_r=35, shy_l=-15, shy_r=-15, el_l=-65, el_r=-65,
                  hp_l=105, hp_r=105, kn_l=-150, kn_r=-150, pitch=-30, fwd=1.0, lift=0.45)
BALL_ALASKA = dict(pitch=0, lift=0, fwd=.75, noglasses=1, curl=62, arch=68, bend=-62, nod=-25, tuck=.3,
                   f_l=25, f_r=25, fk_l=-70, fk_r=-70, b_l=40, b_r=40, bk_l=-100, bk_r=-100)
# Cat gait and fall; keys of tools/blender/alaska.py (f_/b_ shoulder and hip, fk_/bk_ elbow and knee, gl = glasses fall).
CAT_STUMBLE = dict(pitch=-18, lift=.05, bend=-10, nod=15, f_l=50, f_r=60, fk_l=-30, fk_r=-30,
                   b_l=-20, b_r=-20, bk_l=10, bk_r=10, tail=-10)
CAT_FLAIL = dict(pitch=-35, lift=.08, bend=-20, curl=20, nod=-10, f_l=70, f_r=70, fk_l=-40, fk_r=-40,
                 b_l=-30, b_r=-30, bk_l=10, bk_r=10, tail=-10)
GLASSES_FALL = (23, 10)   # the glasses leave the nose after this frame and land 10 frames later


def _mix(a, b, t):
    keys = a.keys() | b.keys()
    return {key: a.get(key, 0) + (b.get(key, 0) - a.get(key, 0)) * t for key in keys}


def pose_at(figure, index):
    """Return a fresh pose dict for a frame; no Blender imports or side effects."""
    i = max(0, min(N - 1, int(index)))
    cat = figure == 'alaska'
    if i < 6:
        p = dict(STAND) if not cat else {}
        p.update(yaw=180 * (1 - i / 5), fwd=0.0)
        return p

    if cat:
        if i <= 17:
            phase = 4 * math.pi * (i - 6) / 11
            stride = math.sin(phase)
            fwd_leg, back_leg = max(0.0, stride), max(0.0, -stride)   # diagonal pairs: front l with hind r
            p = dict(yaw=0, fwd=.05 + .27 * (i - 6) / 11,
                     f_l=28 * stride, f_r=-28 * stride, b_l=-25 * stride, b_r=25 * stride,
                     fk_l=-40 * fwd_leg + 5 * back_leg, fk_r=-40 * back_leg + 5 * fwd_leg,
                     bk_l=-40 * back_leg + 5 * fwd_leg, bk_r=-40 * fwd_leg + 5 * back_leg,
                     nod=5 * math.sin(phase), tail=-18 * math.sin(phase))
        elif i <= 23:
            p = _mix(pose_at(figure, CONTACT - 1), dict(CAT_STUMBLE, yaw=0), (i - CONTACT) / 5)
            p['fwd'] = .32 + .18 * (i - CONTACT) / 5
        elif i < TUCK:
            p = _mix(CAT_STUMBLE, CAT_FLAIL, (i - 23) / 6) if i <= 29 else _mix(CAT_FLAIL, BALL_ALASKA, (i - 29) / 6)
            p.update(yaw=0, fwd=.50 + .25 * (i - 24) / 11, noglasses=0)
            p['gl'] = min(1.0, (i - GLASSES_FALL[0]) / GLASSES_FALL[1]) if i > GLASSES_FALL[0] else 0
        else:
            p = dict(BALL_ALASKA)
    else:
        if i <= 17:
            phase = 4 * math.pi * (i - 6) / 11
            stride = math.sin(phase)
            p = dict(STEP, yaw=0, fwd=.05 + .27 * (i - 6) / 11,
                     hp_l=22 * stride, hp_r=-22 * stride,
                     kn_l=-25 * max(0, stride), kn_r=-25 * max(0, -stride),
                     sh_l=22 * math.sin(phase + math.pi), sh_r=22 * math.sin(phase),
                      el_l=15, el_r=15)
            if i >= 13:
                # The approved review's catching foot reaches the bottle neck.
                contact = dict(p, hp_r=30, kn_r=-10, hp_l=-8, pitch=-12, bend=-12,
                               sh_l=40, sh_r=30, el_l=20, el_r=20)
                p = _mix(p, contact, (i - 13) / 4)
        elif i <= 23:
            p = _mix(pose_at(figure, CONTACT - 1), TRIP, (i - CONTACT) / 5)
            p['yaw'] = 0
            p['fwd'] = .32 + .18 * (i - CONTACT) / 5
        elif i < TUCK:
            if i <= 29:
                t = (i - 23) / 6
                p = _mix(TRIP, FLAIL, t * 2) if t <= .5 else _mix(FLAIL, TUCK_POSE, (t - .5) * 2)
                p['fwd'] = .50 + .28 * (i - 24) / 5
            else:
                p = _mix(TUCK_POSE, BALL_HUMAN, (i - 29) / 6)
                p['fwd'] = .78 + .22 * (i - 29) / 6
            p['yaw'] = 0
        else:
            p = dict(BALL_HUMAN)
    # Tuck is exactly the model's roll pose; subsequent frames continue its pivot rotation.
    if i >= TUCK:
        p['pitch'] = p.get('pitch', 0) - 11.25 * (i - TUCK)
    return p


def bottle_at(figure, index):
    """Bottle transform (location xyz, Euler xyz radians, visible) for deterministic contact."""
    i = max(0, min(N - 1, int(index)))
    cat = figure == 'alaska'
    if not cat:
        # Approved behind-camera placement; hold until the advancing foot arrives.
        t = max(0, min(1, (i - CONTACT) / 6))
        return {'location': (-.35 - .34 * t, .45 + .65 * t, .16),
                'rotation': (math.radians(60 + 100 * t), 0.0, math.radians(-5 - 30 * t)),
                'visible': i <= 24}
    radius = .040 * BOTTLE_SCALE
    # The neck is in the next paw/foot's path; the bright body lies outside its silhouette.
    x = .26 if cat else .41
    y = 1.0 if cat else .66
    if i < CONTACT:
        loc = (x, y, radius)
        angle = math.radians(220)
    elif i <= 24:
        t = (i - CONTACT) / 6
        loc = (x + .28 * t, y + .30 * t, radius + .025 * math.sin(math.pi * t))
        angle = math.radians(220 + 75 * t)
    else:
        t = min(1.0, (i - 24) / 4)
        loc = (x + .28 + .10 * t, y + .30 + .12 * t, radius)
        angle = math.radians(295 + 10 * t)
    return {'location': loc, 'rotation': (math.radians(-60), 0.0, angle), 'visible': i <= 24}

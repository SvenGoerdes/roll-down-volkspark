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
BALL_ALASKA = dict(pitch=-12, lift=0.06, bend=-18, nod=-25, f_l=-48, f_r=-48, fk_l=-95, fk_r=-95,
                   b_l=48, b_r=48, bk_l=95, bk_r=95, tail=68, tuck=1, fwd=0.75)


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
            swing = max(0.0, math.cos(phase))
            p = dict(yaw=0, fwd=.05 + .27 * (i - 6) / 11,
                     f_l=30 * stride, f_r=-30 * stride, b_l=-25 * stride, b_r=25 * stride,
                     fk_l=24 * swing, fk_r=24 * (1 - swing),
                     bk_l=18 * (1 - swing), bk_r=18 * swing, nod=5 * math.sin(phase),
                     tail=-18 * math.sin(phase))
        elif i <= 23:
            t = (i - CONTACT) / 5
            contact = pose_at(figure, CONTACT - 1)
            stumble = dict(yaw=0, pitch=-20, lift=.07, f_l=70, f_r=70, fk_l=65, fk_r=65,
                           b_l=-25, b_r=-25, bk_l=45, bk_r=45, nod=24, tail=-45)
            p = _mix(contact, stumble, t)
            p['fwd'] = .32 + .18 * t
        elif i < TUCK:
            flail = dict(pitch=-20, lift=.07, f_l=70, f_r=70, fk_l=65, fk_r=65,
                          b_l=-25, b_r=-25, bk_l=45, bk_r=45, tail=-45, nod=24)
            tuck = dict(pitch=-35, lift=.07, f_l=58, f_r=58, fk_l=82, fk_r=82,
                         b_l=35, b_r=35, bk_l=70, bk_r=70, tail=50, bend=-20, nod=-10, tuck=.6)
            t = (i - 23) / 6
            p = _mix(flail, tuck, t) if i <= 29 else _mix(tuck, BALL_ALASKA, (i - 29) / 6)
            p['fwd'] = .50 + .25 * (i - 24) / 11
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
    x = .50 if cat else .41
    y = .94 if cat else .66
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

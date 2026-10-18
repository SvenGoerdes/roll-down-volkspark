"""Boundary checks for the offline intro poses; run with python3."""
import math
import unittest

import intro


class IntroTests(unittest.TestCase):
    def test_duration_and_turn(self):
        self.assertEqual(intro.N / intro.FPS, 1.5)
        for figure in ('kalle', 'tine', 'alaska'):
            self.assertEqual(intro.pose_at(figure, 0)['yaw'], 180)
            for frame in (5, 6, 17, 18, 23):
                self.assertEqual(intro.pose_at(figure, frame)['yaw'], 0)

    def test_forward_path_never_steps_back_before_roll(self):
        for figure in ('kalle', 'tine', 'alaska'):
            positions = [intro.pose_at(figure, i).get('fwd', 0) for i in range(intro.TUCK + 1)]
            self.assertEqual(positions, sorted(positions))

    def test_contact_does_not_teleport_figure_or_bottle(self):
        for figure in ('kalle', 'tine', 'alaska'):
            before, contact = intro.pose_at(figure, 17), intro.pose_at(figure, 18)
            for key in before.keys() | contact.keys():
                self.assertEqual(before.get(key, 0), contact.get(key, 0))
            self.assertEqual(intro.bottle_at(figure, 17), intro.bottle_at(figure, 18))
            a, b = intro.bottle_at(figure, 18), intro.bottle_at(figure, 19)
            # The approved human bottle is larger and travels farther when kicked.
            self.assertLess(math.dist(a['location'], b['location']), .08 if figure == 'alaska' else .13)
            self.assertTrue(b['visible'])

    def test_exact_tuck_pose_and_continued_spin(self):
        for figure, ball in (('kalle', intro.BALL_HUMAN), ('tine', intro.BALL_HUMAN),
                             ('alaska', intro.BALL_ALASKA)):
            self.assertEqual(intro.pose_at(figure, intro.TUCK), ball)
            for i in range(intro.TUCK + 1, intro.N):
                pose = intro.pose_at(figure, i)
                self.assertEqual(pose['pitch'], ball['pitch'] - 11.25 * (i - intro.TUCK))
                self.assertEqual({k: v for k, v in pose.items() if k != 'pitch'},
                                 {k: v for k, v in ball.items() if k != 'pitch'})

    def test_cat_has_four_moving_limbs(self):
        poses = [intro.pose_at('alaska', i) for i in range(6, 18)]
        for limb in ('f_l', 'f_r', 'b_l', 'b_r'):
            values = [p[limb] for p in poses]
            self.assertLess(min(values), -10)
            self.assertGreater(max(values), 10)

    def test_approved_human_bottle_placement_and_contact(self):
        for figure in ('kalle', 'tine'):
            before = intro.bottle_at(figure, 0)
            self.assertEqual(before['location'], (-.35, .45, .16))
            self.assertAlmostEqual(before['rotation'][0], math.pi / 3)
            self.assertEqual(before, intro.bottle_at(figure, intro.CONTACT))
            self.assertTrue(intro.bottle_at(figure, 24)['visible'])
            self.assertFalse(intro.bottle_at(figure, 25)['visible'])
            self.assertEqual(intro.pose_at(figure, intro.CONTACT)['hp_r'], 30)

    def test_all_poses_finite_and_returned_independently(self):
        for figure in ('kalle', 'tine', 'alaska'):
            for i in range(intro.N):
                pose = intro.pose_at(figure, i)
                self.assertTrue(all(math.isfinite(v) for v in pose.values()))
                pose['yaw'] = 123456
                self.assertNotEqual(intro.pose_at(figure, i).get('yaw'), 123456)


if __name__ == '__main__':
    unittest.main()

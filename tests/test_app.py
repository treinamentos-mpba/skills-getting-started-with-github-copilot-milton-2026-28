import unittest
from copy import deepcopy

from fastapi.testclient import TestClient

from src.app import activities, app


class UnregisterTests(unittest.TestCase):
    def setUp(self):
        self.original_activities = deepcopy(activities)
        self.client = TestClient(app)

    def tearDown(self):
        activities.clear()
        activities.update(self.original_activities)
        self.client.close()

    def test_unregister_removes_only_selected_participant(self):
        email = activities["Chess Club"]["participants"][0]
        response = self.client.delete(
            "/activities/Chess%20Club/signup", params={"email": email}
        )
        self.assertEqual(response.status_code, 200)
        expected = deepcopy(self.original_activities)
        expected["Chess Club"]["participants"].remove(email)
        self.assertEqual(self.client.get("/activities").json(), expected)

        repeated = self.client.delete(
            "/activities/Chess%20Club/signup", params={"email": email}
        )
        self.assertEqual(repeated.status_code, 404)
        self.assertEqual(activities, expected)

    def test_unknown_activity_leaves_data_unchanged(self):
        response = self.client.delete(
            "/activities/Unknown/signup", params={"email": "student@example.com"}
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(activities, self.original_activities)

    def test_unknown_participant_leaves_data_unchanged(self):
        response = self.client.delete(
            "/activities/Chess%20Club/signup", params={"email": "student@example.com"}
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(activities, self.original_activities)

    def test_student_can_sign_up_again_after_unregistering(self):
        email = activities["Chess Club"]["participants"][0]
        self.client.delete("/activities/Chess%20Club/signup", params={"email": email})
        response = self.client.post(
            "/activities/Chess%20Club/signup", params={"email": email}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(activities["Chess Club"]["participants"].count(email), 1)
from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app


@pytest.fixture
def client():
    original_activities = deepcopy(activities)
    with TestClient(app) as test_client:
        yield test_client
    activities.clear()
    activities.update(original_activities)


def test_unregister_removes_only_selected_participant(client):
    # Arrange
    email = activities["Chess Club"]["participants"][0]
    expected = deepcopy(activities)
    expected["Chess Club"]["participants"].remove(email)

    # Act
    response = client.delete(
        "/activities/Chess%20Club/signup", params={"email": email}
    )
    activities_response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    assert activities_response.json() == expected


def test_unregistering_twice_returns_not_found(client):
    # Arrange
    email = activities["Chess Club"]["participants"][0]
    expected = deepcopy(activities)
    expected["Chess Club"]["participants"].remove(email)

    # Act
    first_response = client.delete(
        "/activities/Chess%20Club/signup", params={"email": email}
    )
    repeated_response = client.delete(
        "/activities/Chess%20Club/signup", params={"email": email}
    )

    # Assert
    assert first_response.status_code == 200
    assert repeated_response.status_code == 404
    assert activities == expected


def test_unknown_activity_leaves_data_unchanged(client):
    # Arrange
    original_activities = deepcopy(activities)

    # Act
    response = client.delete(
        "/activities/Unknown/signup", params={"email": "student@example.com"}
    )

    # Assert
    assert response.status_code == 404
    assert activities == original_activities


def test_unknown_participant_leaves_data_unchanged(client):
    # Arrange
    original_activities = deepcopy(activities)

    # Act
    response = client.delete(
        "/activities/Chess%20Club/signup", params={"email": "student@example.com"}
    )

    # Assert
    assert response.status_code == 404
    assert activities == original_activities


def test_student_can_sign_up_again_after_unregistering(client):
    # Arrange
    email = activities["Chess Club"]["participants"][0]

    # Act
    unregister_response = client.delete(
        "/activities/Chess%20Club/signup", params={"email": email}
    )
    signup_response = client.post(
        "/activities/Chess%20Club/signup", params={"email": email}
    )

    # Assert
    assert unregister_response.status_code == 200
    assert signup_response.status_code == 200
    assert activities["Chess Club"]["participants"].count(email) == 1
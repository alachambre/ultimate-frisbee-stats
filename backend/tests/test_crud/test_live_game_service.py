from app import models
from app.crud import points
from app.schemas import PointCreate
from app.services.live_game import launch_pull


def test_launch_pull_starts_point_and_game_clock(
    db_session,
    sample_game,
    sample_players,
):
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=[player.id for player in sample_players],
        ),
    )

    launch_pull(db_session, point)
    db_session.commit()
    db_session.refresh(point)
    db_session.refresh(sample_game)

    assert point.status == models.PointStatusEnum.running
    assert point.start_datetime is not None
    assert sample_game.start_datetime == point.start_datetime

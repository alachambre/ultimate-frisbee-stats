"""
Tests for Strategy CRUD operations
"""
import pytest
from app import crud, schemas


def test_create_strategy_basic(db_session):
    """Test creating a basic offense strategy"""
    strategy_data = schemas.StrategyCreate(
        name="Horizontal Stack",
        description="Spread offense with horizontal cutting lanes",
        category=schemas.StrategyCategory.offense
    )

    strategy = crud.create_strategy(db_session, strategy_data)

    assert strategy.id is not None
    assert strategy.name == "Horizontal Stack"
    assert strategy.description == "Spread offense with horizontal cutting lanes"
    assert strategy.category.value == "offense"  # Compare enum value
    assert strategy.created_at is not None


def test_create_strategy_minimal(db_session):
    """Test creating a strategy with minimal fields (no description)"""
    strategy_data = schemas.StrategyCreate(
        name="Zone Defense",
        description=None,
        category=schemas.StrategyCategory.defense
    )

    strategy = crud.create_strategy(db_session, strategy_data)

    assert strategy.id is not None
    assert strategy.name == "Zone Defense"
    assert strategy.description is None
    assert strategy.category.value == "defense"  # Compare enum value


def test_create_strategy_duplicate_name(db_session, sample_strategy):
    """Test creating a strategy with duplicate name fails"""
    duplicate_data = schemas.StrategyCreate(
        name=sample_strategy.name,  # Same name as existing
        description="Different description",
        category=schemas.StrategyCategory.offense
    )

    with pytest.raises(ValueError, match="already exists"):
        crud.create_strategy(db_session, duplicate_data)


def test_get_strategy(db_session, sample_strategy):
    """Test retrieving a strategy by ID"""
    strategy = crud.get_strategy(db_session, sample_strategy.id)

    assert strategy is not None
    assert strategy.id == sample_strategy.id
    assert strategy.name == sample_strategy.name


def test_get_strategy_not_found(db_session):
    """Test retrieving non-existent strategy returns None"""
    strategy = crud.get_strategy(db_session, strategy_id=999)
    assert strategy is None


def test_get_strategies_all(db_session, sample_strategy, sample_defense_strategy):
    """Test retrieving all strategies"""
    strategies = crud.get_strategies(db_session)

    assert len(strategies) == 2
    assert any(s.id == sample_strategy.id for s in strategies)
    assert any(s.id == sample_defense_strategy.id for s in strategies)


def test_get_strategies_by_category_offense(db_session, sample_strategy, sample_defense_strategy):
    """Test filtering strategies by offense category"""
    strategies = crud.get_strategies(db_session, category=schemas.StrategyCategory.offense)

    assert len(strategies) == 1
    assert strategies[0].id == sample_strategy.id
    assert strategies[0].category.value == "offense"  # Compare enum value


def test_get_strategies_by_category_defense(db_session, sample_strategy, sample_defense_strategy):
    """Test filtering strategies by defense category"""
    strategies = crud.get_strategies(db_session, category=schemas.StrategyCategory.defense)

    assert len(strategies) == 1
    assert strategies[0].id == sample_defense_strategy.id
    assert strategies[0].category.value == "defense"  # Compare enum value


def test_get_strategies_empty(db_session):
    """Test retrieving strategies when none exist"""
    strategies = crud.get_strategies(db_session)
    assert len(strategies) == 0


def test_get_strategies_pagination(db_session):
    """Test pagination for strategies"""
    # Create 5 strategies
    for i in range(5):
        crud.create_strategy(
            db_session,
            schemas.StrategyCreate(
                name=f"Strategy {i}",
                description=f"Description {i}",
                category=schemas.StrategyCategory.offense
            )
        )

    # Get first 2
    strategies_page1 = crud.get_strategies(db_session, skip=0, limit=2)
    assert len(strategies_page1) == 2

    # Get next 2
    strategies_page2 = crud.get_strategies(db_session, skip=2, limit=2)
    assert len(strategies_page2) == 2

    # No overlap
    page1_ids = {s.id for s in strategies_page1}
    page2_ids = {s.id for s in strategies_page2}
    assert len(page1_ids & page2_ids) == 0


def test_update_strategy_full(db_session, sample_strategy):
    """Test updating all fields of a strategy"""
    update_data = schemas.StrategyUpdate(
        name="Updated Stack",
        description="Updated description",
        category=schemas.StrategyCategory.defense
    )

    updated = crud.update_strategy(db_session, sample_strategy.id, update_data)

    assert updated is not None
    assert updated.id == sample_strategy.id
    assert updated.name == "Updated Stack"
    assert updated.description == "Updated description"
    assert updated.category.value == "defense"  # Compare enum value


def test_update_strategy_partial(db_session, sample_strategy):
    """Test partially updating a strategy"""
    original_name = sample_strategy.name
    original_category = sample_strategy.category

    update_data = schemas.StrategyUpdate(description="New description only")

    updated = crud.update_strategy(db_session, sample_strategy.id, update_data)

    assert updated is not None
    assert updated.name == original_name  # Unchanged
    assert updated.description == "New description only"
    assert updated.category == original_category  # Unchanged


def test_update_strategy_not_found(db_session):
    """Test updating non-existent strategy returns None"""
    update_data = schemas.StrategyUpdate(name="New Name")
    updated = crud.update_strategy(db_session, strategy_id=999, strategy_update=update_data)
    assert updated is None


def test_update_strategy_duplicate_name(db_session, sample_strategy, sample_defense_strategy):
    """Test updating strategy with duplicate name fails"""
    update_data = schemas.StrategyUpdate(name=sample_defense_strategy.name)

    with pytest.raises(ValueError, match="already exists"):
        crud.update_strategy(db_session, sample_strategy.id, update_data)


def test_delete_strategy(db_session, sample_strategy):
    """Test deleting a strategy"""
    strategy_id = sample_strategy.id

    # Delete
    success = crud.delete_strategy(db_session, strategy_id)
    assert success is True

    # Verify deletion
    deleted = crud.get_strategy(db_session, strategy_id)
    assert deleted is None


def test_delete_strategy_not_found(db_session):
    """Test deleting non-existent strategy returns False"""
    success = crud.delete_strategy(db_session, strategy_id=999)
    assert success is False


def test_delete_strategy_sets_null_on_points(db_session, sample_strategy, sample_game, sample_players):
    """Test that deleting a strategy sets strategy_id to NULL on points (ON DELETE SET NULL)"""
    from datetime import datetime, timezone

    # Create a point with the strategy
    point_data = schemas.PointCreate(
        game_id=sample_game.id,
        starting_on_offense=True,
        strategy_id=sample_strategy.id,
        player_ids=[p.id for p in sample_players[:7]],
        start_datetime=datetime.now(timezone.utc)
    )
    point = crud.create_point(db_session, point_data)
    assert point.strategy_id == sample_strategy.id

    # Delete the strategy
    success = crud.delete_strategy(db_session, sample_strategy.id)
    assert success is True

    # Point should still exist but strategy_id should be NULL
    db_session.expire(point)  # Force reload from DB
    updated_point = crud.get_point(db_session, point.id)
    assert updated_point is not None
    assert updated_point.strategy_id is None

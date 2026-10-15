"""
RAKTSETU - Unit Tests for Haversine Geodetic Distance Calculation
Tests:
- Zero distance for identical coordinates
- Known coordinate benchmarks across Pune landmarks
- Mathematical symmetry: dist(A, B) == dist(B, A)
- Coordinate boundary enforcement (lat in [-90, 90], lon in [-180, 180])
- None / invalid coordinate handling
"""

import pytest
from app.services.matching import haversine_distance


def test_identical_coordinates_zero_distance():
    """Distance between identical coordinates must be exactly 0.0 km."""
    d = haversine_distance(18.5593, 73.9826, 18.5593, 73.9826)
    assert d == 0.0


def test_known_pune_coordinate_distances():
    """Verify calculated distances match known geodetic benchmarks in Pune."""
    # Wagholi (18.5593, 73.9826) to Hadapsar (18.5018, 73.9260)
    # Geodetic distance is approximately 8.6-8.8 km
    d_wagholi_hadapsar = haversine_distance(18.5593, 73.9826, 18.5018, 73.9260)
    assert 8.0 <= d_wagholi_hadapsar <= 9.2
    assert isinstance(d_wagholi_hadapsar, float)

    # Kothrud (18.5074, 73.8077) to Baner (18.5590, 73.7868)
    # Geodetic distance is approximately 6.0-6.3 km
    d_kothrud_baner = haversine_distance(18.5074, 73.8077, 18.5590, 73.7868)
    assert 5.5 <= d_kothrud_baner <= 6.8


def test_haversine_symmetry():
    """haversine(A, B) must equal haversine(B, A)."""
    p1 = (18.5308, 73.8475)  # Shivajinagar
    p2 = (18.6280, 73.7995)  # Pimpri
    d1 = haversine_distance(p1[0], p1[1], p2[0], p2[1])
    d2 = haversine_distance(p2[0], p2[1], p1[0], p1[1])
    assert d1 == d2


def test_coordinate_validation_boundaries():
    """Latitude must be in [-90, 90], Longitude must be in [-180, 180]."""
    # Invalid latitudes
    with pytest.raises(ValueError):
        haversine_distance(91.0, 73.8, 18.5, 73.8)
    with pytest.raises(ValueError):
        haversine_distance(-95.0, 73.8, 18.5, 73.8)

    # Invalid longitudes
    with pytest.raises(ValueError):
        haversine_distance(18.5, 181.0, 18.5, 73.8)
    with pytest.raises(ValueError):
        haversine_distance(18.5, -185.0, 18.5, 73.8)

    # None coordinates
    with pytest.raises(ValueError):
        haversine_distance(None, 73.8, 18.5, 73.8)
    with pytest.raises(ValueError):
        haversine_distance(18.5, None, 18.5, 73.8)

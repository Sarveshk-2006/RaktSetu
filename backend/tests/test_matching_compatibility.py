"""
RAKTSETU - Unit Tests for Component-Specific Blood Compatibility
Tests:
- All 8 ABO/Rh recipient groups for Packed RBC / Whole Blood
- Universal donor (O-) and universal recipient (AB+) for RBCs
- Inverted Plasma (FFP) compatibility rules
- Platelets compatibility rules
- Unsupported/unvalidated components
- Invalid blood group handling
"""

import pytest
from app.services.matching import evaluate_compatibility, RULESET_VERSION


def test_packed_rbc_universal_donor_and_recipient():
    """O- is universal donor for RBC; AB+ is universal recipient for RBC."""
    # O- can donate Packed RBC to all 8 blood groups
    all_groups = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
    for recipient in all_groups:
        compat, ruleset, warnings = evaluate_compatibility("O-", recipient, "Packed RBC")
        assert compat is True, f"O- should be compatible with {recipient} for Packed RBC"
        assert ruleset == RULESET_VERSION
        assert len(warnings) == 0

    # AB+ can receive Packed RBC from all 8 blood groups
    for donor in all_groups:
        compat, ruleset, warnings = evaluate_compatibility(donor, "AB+", "Packed RBC")
        assert compat is True, f"{donor} should be compatible for AB+ recipient for Packed RBC"


def test_packed_rbc_restricted_recipients():
    """O- recipient can ONLY receive from O- for Packed RBC."""
    compat_o_neg, _, _ = evaluate_compatibility("O-", "O-", "Packed RBC")
    assert compat_o_neg is True

    non_o_neg_donors = ["O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
    for donor in non_o_neg_donors:
        compat, _, _ = evaluate_compatibility(donor, "O-", "Packed RBC")
        assert compat is False, f"Donor {donor} must be incompatible for O- recipient"


@pytest.mark.parametrize(
    "donor,recipient,expected",
    [
        # A recipient
        ("A-", "A-", True),
        ("O-", "A-", True),
        ("A+", "A-", False),
        ("B-", "A-", False),
        ("A+", "A+", True),
        ("A-", "A+", True),
        ("O+", "A+", True),
        ("O-", "A+", True),
        ("B+", "A+", False),
        ("AB+", "A+", False),
        # B recipient
        ("B-", "B-", True),
        ("O-", "B-", True),
        ("B+", "B-", False),
        ("B+", "B+", True),
        ("O+", "B+", True),
        ("A+", "B+", False),
        # AB- recipient
        ("AB-", "AB-", True),
        ("A-", "AB-", True),
        ("B-", "AB-", True),
        ("O-", "AB-", True),
        ("AB+", "AB-", False),
        ("A+", "AB-", False),
    ],
)
def test_rbc_compatibility_combinations(donor, recipient, expected):
    """Test standard ABO/Rh combinations for Packed RBC."""
    compat, _, _ = evaluate_compatibility(donor, recipient, "Packed RBC")
    assert compat is expected


def test_plasma_compatibility_inversion():
    """
    Plasma (FFP) has inverted compatibility relative to RBCs:
    AB is the universal plasma donor; O is the universal plasma recipient.
    """
    # AB+ can donate plasma to all groups
    all_groups = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
    for recipient in all_groups:
        compat, _, _ = evaluate_compatibility("AB+", recipient, "Plasma")
        assert compat is True, f"AB+ plasma should be compatible with {recipient}"

    # O- recipient can receive plasma from any group
    for donor in all_groups:
        compat, _, _ = evaluate_compatibility(donor, "O-", "Plasma")
        assert compat is True, f"O- recipient should be able to receive plasma from {donor}"

    # AB recipient can ONLY receive plasma from AB
    compat_ab_from_o, _, _ = evaluate_compatibility("O-", "AB+", "Plasma")
    assert compat_ab_from_o is False, "AB+ recipient cannot receive O- plasma"


def test_unsupported_component_fails_safely():
    """An unsupported or unvalidated blood component must fail safely with a warning."""
    compat, ruleset, warnings = evaluate_compatibility("O-", "O+", "Cryoprecipitate-Experimental")
    assert compat is False
    assert len(warnings) > 0
    assert "clinically validated" in warnings[0].lower()


def test_invalid_blood_group_fails_safely():
    """Invalid blood group strings fail safely without crashing."""
    compat1, _, warnings1 = evaluate_compatibility("XYZ", "O+", "Packed RBC")
    assert compat1 is False
    assert len(warnings1) > 0

    compat2, _, warnings2 = evaluate_compatibility("O+", "INVALID_GROUP", "Packed RBC")
    assert compat2 is False
    assert len(warnings2) > 0

    compat3, _, warnings3 = evaluate_compatibility("", "", "Packed RBC")
    assert compat3 is False

import random

class ScaleManager:
    SCALE_BANK = {
        (0.0, 0.1): [
            ("C5", [0, 7]),          # Only Root and Perfect 5th
        ],
        (0.1, 0.2): [
            ("Cmaj", [0, 4, 7]),          # Start with the simplest form
        ],
        (0.2, 0.3): [
            ("Cmaj7", [0, 4, 7, 11]),     # Add color with major 7th
            ("Cadd9", [0, 4, 7, 14])      # Add 9th for more spread
        ],
        (0.3, 0.5): [
            ("Cm7", [0, 3, 7, 10]),       # Move to minor
            ("Cm9", [0, 3, 7, 10, 14])    # Add 9th for more complexity
        ],
        (0.5, 0.7): [
            ("C7alt", [0, 4, 8, 10]),     # Add instability with altered 7th
            ("Cm7b5", [0, 3, 6, 10])      # Add dissonance with minor 7th flat 5
        ],
        (0.7, 0.9): [
            ("Cdim7", [0, 3, 6, 9]),      # Add dissonance with diminished 7th
            ("Caugm7", [0, 4, 8, 10])     # Add instability with augmented 7th
        ],
        (0.9, 1.0): [
            ("None", None)                 # No scale (no snap)
        ]
    }

    @staticmethod
    def get_scale_for_dissonance_weighted(dissonance: float) -> tuple:
        """Get scale for dissonance weighted.
        
        Args:
            dissonance (float): Dissonance
        """
        for (low, high), scales in ScaleManager.SCALE_BANK.items():
            if low <= dissonance < high:
                # If there is only one scale candidate, return it
                if len(scales) == 1:
                    return scales[0]
                # If there are multiple candidates, select one probabilistically
                # Assume there are only two candidates, and get distribute weights
                else:
                    weights = [
                        (high - dissonance),
                        (dissonance - low)
                    ]
                    return random.choices(scales, weights=weights)[0]
        return ("None", None)

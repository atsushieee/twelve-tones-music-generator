from dataclasses import dataclass
from typing import List, Dict, Union, Optional
import random
from music_generator.scale_manager import ScaleManager


@dataclass
class VoiceState:
    melody_row: List[int]
    base_row: List[int]
    row_retro: List[int]
    row_inverted: List[int]
    row_retro_inverted: List[int]
    sequence_index: int = 0

class MusicGenerator:
    def __init__(self):
        self.client_states: Dict[str, Dict[int, VoiceState]] = {}
    
    def init_voice_state(self, client_id: str, voice_id: int) -> None:
        """Initialize voice state.
        
        Args:
            client_id (str): Client ID
            voice_id (int): Voice ID
        """
        if client_id not in self.client_states:
            self.client_states[client_id] = {}
            
        # Generate new 12-note sequence
        base_row = self.generate_new_sequence()
        row_retro = self.retrograde(base_row)
        row_inverted = self.inversion(base_row)
        row_retro_inverted = self.retrograde(row_inverted)
        
        self.client_states[client_id][voice_id] = VoiceState(
            melody_row=[],
            base_row=base_row,
            row_retro=row_retro,
            row_inverted=row_inverted,
            row_retro_inverted=row_retro_inverted,
            sequence_index=0
        )

    def get_voice_state(self, client_id: str, voice_id: int) -> Optional[VoiceState]:
        """Get voice state.
        
        Args:
            client_id (str): Client ID
            voice_id (int): Voice ID
        """
        return self.client_states.get(client_id, {}).get(voice_id)

    def generate_new_sequence(self) -> List[int]:
        """Generate new 12-note sequence.
        
        Returns:
            List[int]: 12-note sequence
        """
        notes = list(range(60, 72))  # 60-71 (C4-B4)
        random.shuffle(notes)
        return notes

    def retrograde(self, row: List[int]) -> List[int]:
        """Generate retrograde sequence.
        
        Args:
            row (List[int]): 12-note sequence
        Returns:
            List[int]: Retrograde sequence
        """
        return row[::-1]

    def inversion(self, row: List[int]) -> List[int]:
        """Generate inversion sequence.
        
        Args:
            row (List[int]): 12-note sequence
        Returns:
            List[int]: Inversion sequence
        """
        base_note = row[0]
        inverted = [base_note - (note - base_note) for note in row]
        return [(((note - 60 + 12) % 12) + 60) for note in inverted]
    
    def snap_note(self, note: int, scale_pcs: List[int]) -> int:
        """Snap note to scale.
        
        Args:
            note (int): Note
            scale_pcs (List[int]): Scale PC
        Returns:
            int: Snapped note
        """
        pc = note % 12
        octave = note // 12
        if scale_pcs is None:
            return note
        distances = [(s, min(abs(s - pc), 12 - abs(s - pc))) for s in scale_pcs]
        min_distance = min(distances, key=lambda x: x[1])[1]
        closest_pcs = [s for s, d in distances if d == min_distance]
        closest_pc = random.choice(closest_pcs)
        snapped_note = closest_pc + (octave * 12)
        possible_notes = [snapped_note - 12, snapped_note, snapped_note + 12]
        return min(possible_notes, key=lambda n: abs(n - note))

    def adjust_note_to_range(
            self, note: int, lower_note: int, upper_note: int
    ) -> Union[int, None]:
        """Adjust note to range.
        
        Args:
            note (int): Note
            lower_note (int): Lower note
            upper_note (int): Upper note
        Returns:
            Union[int, None]: Adjusted note or None
        """
        pitch_class = note % 12
        min_octave = lower_note // 12
        max_octave = upper_note // 12
        
        possible_octaves = []
        for octave in range(min_octave, max_octave + 1):
            note_in_octave = pitch_class + (octave * 12)
            if lower_note <= note_in_octave <= upper_note:
                possible_octaves.append(octave)
        
        if not possible_octaves:
            return None
        
        selected_octave = random.choice(possible_octaves)
        return pitch_class + (selected_octave * 12)

    def get_note_duration(self, complexity: int) -> str:
        """Determine note duration based on complexity.
        
        Args:
            complexity (int): Complexity
        Returns:
            str: Note duration
        """
        if complexity <= 0:
            return '2n'
        elif complexity <= 25:
            return random.choices(['2n', '4n'], weights=[1 - (0.5 * complexity/25), 0.5 * complexity/25])[0]
        elif complexity <= 50:
            weights = [
                0.5 - (0.167 * (complexity-25)/25),
                0.5 - (0.167 * (complexity-25)/25),
                0.333 * (complexity-25)/25
            ]
            return random.choices(['2n', '4n', '8n'], weights=weights)[0]
        elif complexity <= 75:
            weights = [
                0.333 - (0.083 * (complexity-50)/25),
                0.333 - (0.083 * (complexity-50)/25),
                0.333 - (0.083 * (complexity-50)/25),
                0.25 * (complexity-50)/25
            ]
            return random.choices(['2n', '4n', '8n', '16n'], weights=weights)[0]
        else:
            weights = [
                0.25 - (0.05 * (complexity-75)/25),
                0.25 - (0.05 * (complexity-75)/25),
                0.25 - (0.05 * (complexity-75)/25),
                0.25 - (0.05 * (complexity-75)/25),
                0.2 * (complexity-75)/25
            ]
            return random.choices(['2n', '4n', '8n', '16n', '32n'], weights=weights)[0]

    def generate_next_notes(
        self, 
        client_id: str, 
        voice_id: int, 
        params: Dict, 
        global_params: Dict, 
        duration: int = 1
    ) -> List[Dict]:
        """Generate next notes based on 12-note technique.
        
        Args:
            client_id (str): Client ID
            voice_id (int): Voice ID
            params (Dict): Parameters
            global_params (Dict): Global parameters
            duration (int): Duration
        Returns:
            List[Dict]: Next notes
        """
        state = self.get_voice_state(client_id, voice_id)
        if not state:
            self.init_voice_state(client_id, voice_id)
            state = self.get_voice_state(client_id, voice_id)

        notes_data = []
        dissonance_level = global_params["dissonanceLevel"]
        tempo_factor = global_params.get("tempoFactor", 1.0)
        volume_factor = global_params.get("volumeFactor", 1.0)
        _, scale_pcs = ScaleManager.get_scale_for_dissonance_weighted(dissonance_level)

        for _ in range(duration):
            # Process duration, velocity, and tempo
            adjusted_duration = self.get_note_duration(params["duration"])
            velocity_variation = params["velocityVariation"] / 100
            variation_range = velocity_variation * 0.5
            adjusted_velocity = (params["velocity"] * volume_factor) + (random.random() * variation_range * 2 - variation_range)
            adjusted_velocity = max(0, min(1, adjusted_velocity))
            
            adjusted_tempo = (params["tempo"] * tempo_factor) + (params["tempo"] * 0.1 * (random.random() * 2 - 1))

            # Process rest
            if params["rest"] and (random.random() < params["restProbability"] / 100):
                notes_data.append({
                    "notes": [],
                    "duration": adjusted_duration,
                    "velocity": adjusted_velocity,
                    "tempo": adjusted_tempo
                })
                continue

            # If melody_row is used up or not yet generated
            if not state.melody_row or state.sequence_index >= len(state.melody_row):
                # Generate new 12-note sequence with 25% probability
                if not state.melody_row or random.random() < 0.25:
                    state.base_row = self.generate_new_sequence()
                    state.row_retro = self.retrograde(state.base_row)
                    state.row_inverted = self.inversion(state.base_row)
                    state.row_retro_inverted = self.retrograde(state.row_inverted)

                # Select one of the four rows randomly
                selected_row = random.choice([
                    state.base_row,
                    state.row_retro,
                    state.row_inverted,
                    state.row_retro_inverted
                ])

                state.melody_row = []
                
                for i, note in enumerate(selected_row):
                    snapped_note = self.snap_note(note, scale_pcs)
                    adjusted_note = self.adjust_note_to_range(
                        snapped_note,
                        params["rangeLower"],
                        params["rangeUpper"]
                    )
                    if adjusted_note is not None:
                        state.melody_row.append(adjusted_note)

                state.sequence_index = 0

            # Generate chord
            chord_prob = params["chordProbability"]
            num_notes = 1
            
            if chord_prob > 0:
                random_value = random.random() * 100
                if chord_prob <= 50:
                    if random_value < chord_prob:
                        num_notes = 2
                else:
                    ratio = (chord_prob - 50) / 50
                    three_note_prob = ratio * 33
                    remaining_prob = 100 - three_note_prob
                    if random_value < three_note_prob:
                        num_notes = 3
                    elif random_value < three_note_prob + remaining_prob/2:
                        num_notes = 2

            # Consider remaining notes
            remaining_notes = len(state.melody_row) - state.sequence_index
            num_notes = min(num_notes, remaining_notes)

            # Get notes
            notes = []
            for i in range(num_notes):
                notes.append(state.melody_row[state.sequence_index + i])
            state.sequence_index += num_notes

            notes_data.append({
                "notes": notes,
                "duration": adjusted_duration,
                "velocity": adjusted_velocity,
                "tempo": adjusted_tempo
            })

        return notes_data

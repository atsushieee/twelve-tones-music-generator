from typing import List, Dict, Optional
import random

class ScaleManager:
    SCALE_BANK = {
        (0.0, 0.1): [
            ("Cmaj", [0, 4, 7]),          # 最もシンプルな形から始める
        ],
        (0.1, 0.3): [
            ("Cmaj7", [0, 4, 7, 11]),     # メジャー7thで色を付ける
            ("Cadd9", [0, 4, 7, 14])      # add9での広がり
        ],
        (0.3, 0.5): [
            ("Cm7", [0, 3, 7, 10]),       # マイナーに移行
            ("Cm9", [0, 3, 7, 10, 14])    # マイナー9thでより複雑に
        ],
        (0.5, 0.7): [
            ("C7alt", [0, 4, 8, 10]),     # オルタードで不安定さを出す
            ("Cm7b5", [0, 3, 6, 10])      # 半音を含むことで不協和性を高める
        ],
        (0.7, 0.9): [
            ("Cdim7", [0, 3, 6, 9]),      # 完全に不安定な響きへ
            ("Caugm7", [0, 4, 8, 10])     # さらに不安定さを増す
        ],
        (0.9, 1.0): [
            ("None", None)                 # 無調（スナップなし）
        ]
    }

    @staticmethod
    def get_scale_for_dissonance_weighted(dissonance: float) -> tuple:
        for (low, high), scales in ScaleManager.SCALE_BANK.items():
            if low <= dissonance < high:
                # スケール候補が1つだけならそのまま返す
                if len(scales) == 1:
                    return scales[0]
                # 複数あるときは重みを計算して確率的に選択
                # 一旦2つだけを想定し、重みを (high - dissonance) / (dissonance - low) で割り振り
                else:
                    weights = [
                        (high - dissonance),
                        (dissonance - low)
                    ]
                    return random.choices(scales, weights=weights)[0]
        return ("None", None)
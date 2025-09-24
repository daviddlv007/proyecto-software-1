#!/usr/bin/env python3
import os

# Paths generales
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FEATURE_NAME = "board"
FEATURES_DIR = os.path.join(BASE_DIR, '..', '..', 'frontend', 'src', 'app', 'features')
OUTPUT_FEATURE_DIR = os.path.join(FEATURES_DIR, FEATURE_NAME)

# Carpetas internas del feature
FOLDERS = ["models", "data-access", "ui", "pages"]

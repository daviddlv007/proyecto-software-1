#!/usr/bin/env python3
import os

def create_folders(folders, base_dir):
    for folder in folders:
        path = os.path.join(base_dir, folder)
        os.makedirs(path, exist_ok=True)

def write_file(relative_path, content, base_dir):
    full_path = os.path.join(base_dir, relative_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    if not os.path.exists(full_path):
        with open(full_path, 'w') as f:
            f.write(content)

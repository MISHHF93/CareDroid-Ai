#!/bin/bash
# Setup script for NLU service (Linux/macOS)

set -e

echo "🚀 Setting up NLU Service (Linux/macOS)"
echo "========================================"

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $python_version"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Verify installation
echo "Verifying installation..."
python -c "import torch; import transformers; import fastapi; print('✓ All core dependencies installed')"

# Optional: Install dev dependencies
read -p "Install development dependencies? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pip install -r requirements-dev.txt
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Activate venv:      source venv/bin/activate"
echo "2. Prepare data:       python prepare_data.py"
echo "3. Train model:        python train.py"
echo "4. Evaluate model:     python evaluate.py"
echo "5. Start service:      python -m uvicorn app:app --reload"
echo ""
echo "For more information, see README.md"

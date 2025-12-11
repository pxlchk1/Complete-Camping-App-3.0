#!/bin/bash

PLATFORM="$1"
echo "Running pre-install hook for platform: $PLATFORM"

# Remove M1 workaround from Podfile if it exists (iOS only)
if [ "$PLATFORM" = "ios" ] && [ -f "ios/Podfile" ]; then
  echo "Modifying Podfile to remove M1 workaround..."
  sed -i '' '/_apply_Xcode_12_5_M1_post_install_workaround/d' ios/Podfile
  echo "Podfile modified successfully"
fi

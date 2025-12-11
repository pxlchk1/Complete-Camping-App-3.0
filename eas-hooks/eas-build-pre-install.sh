#!/bin/bash

# Remove M1 workaround from Podfile if it exists
if [ -f "ios/Podfile" ]; then
  echo "Modifying Podfile to remove M1 workaround..."
  sed -i '' '/_apply_Xcode_12_5_M1_post_install_workaround/d' ios/Podfile
  echo "Podfile modified successfully"
fi

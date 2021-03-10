#!/usr/bin/env python
# Fetch poe's latest internal patch number from the poe patch server.
#
# PoE has two version numbers:
# * the user-facing version number; ex: `3.13.1e`
# * the internal patch number; ex: `3.13.1.7`
# This script fetches the second number.
import PyPoE.poe.patchserver
patch = PyPoE.poe.patchserver.Patch()
print(patch.version)

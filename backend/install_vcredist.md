# Fix PyTorch DLL Error on Windows

## Problem
You're seeing this error:
```
OSError: [WinError 126] The specified module could not be found. Error loading "fbgemm.dll" or one of its dependencies.
```

## Solution: Install Visual C++ Redistributables

PyTorch requires Visual C++ Redistributables to run on Windows. Follow these steps:

### Option 1: Download and Install (Recommended)
1. Download Visual C++ Redistributables from Microsoft:
   - Direct link: https://aka.ms/vs/17/release/vc_redist.x64.exe
   - Or search for "Visual C++ Redistributables 2022" on Microsoft's website

2. Run the installer (vc_redist.x64.exe)

3. Restart your terminal/IDE

4. Restart your uvicorn server

5. Try uploading a file again

### Option 2: Use Windows Package Manager (if you have winget)
```powershell
winget install Microsoft.VCRedist.2015+.x64
```

### Option 3: Alternative PyTorch Installation (if above doesn't work)
Try installing PyTorch from conda-forge (requires conda):
```powershell
conda install pytorch cpuonly -c conda-forge
```

## Verification
After installing, test if PyTorch works:
```powershell
cd "C:\Documents\projects\Minor1(appeal_approval)"
.\venv310\Scripts\python.exe -c "import torch; print('Success!')"
```

If you see "Success!", PyTorch is working correctly.


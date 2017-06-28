@if (@CodeSection == @Batch) @then
@echo off
CScript //nologo //E:JScript "%~F0"
rem Open the browser here
goto :EOF
@end
WScript.CreateObject("WScript.Shell").SendKeys("{F3}");
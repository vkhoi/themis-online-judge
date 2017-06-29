@if (@CodeSection == @Batch) @then
echo "1"
CScript //nologo //E:JScript "%~F0"
rem Open the browser here
goto :EOF
@end
echo "2"
WScript.CreateObject("WScript.Shell").SendKeys("{F3}");
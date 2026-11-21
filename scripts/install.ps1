param([Parameter(Mandatory=$true)][string]$Target,[Parameter(Mandatory=$true)][string]$HostName)
$ErrorActionPreference = 'Stop'
node packages/cli/accesssutra.mjs install-ide --target $Target --host $HostName
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

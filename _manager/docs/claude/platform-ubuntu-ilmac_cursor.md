claude code를 터미널에서 사용하면서 playwright mcp를 설치하였어요. 이곳(cursor extension)에서도 사용할 수 있나요?


Playwright MCP를 Cursor extension(VSCode 환경)에서 사용하려면 별도의 설정이 필요합니다. 터미널 Claude Code와 Cursor extension의 Claude Code는 서로 다른 환경입니다:
터미널 Claude Code: ~/.config/claude-code/settings.json에서 MCP 설정
VSCode/Cursor extension: VSCode 설정에서 별도로 MCP를 구성해야 함
Cursor extension에서 Playwright MCP를 사용하려면:
VSCode 설정 파일(settings.json)에 MCP 서버 설정 추가 필요
또는 Cursor extension이 제공하는 MCP 설정 방법 사용
현재 Cursor extension이 MCP를 지원하는지, 지원한다면 어떻게 설정하는지 확인이 필요합니다. Cursor extension의 설정 문서를 확인하시거나, VSCode의 settings.json에 MCP 관련 설정을 추가할 수 있는지 확인해보시는 것을 권장합니다. 터미널에서 설치한 MCP는 자동으로 Cursor extension에 반영되지 않습니다.
const fs = require('fs');
const path = require('path');

const repoPath = './';  // 리포지토리의 경로
const markdownFiles = [];

// 재귀적으로 .md 파일을 찾는 함수
function findMarkdownFiles(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            findMarkdownFiles(filePath);
        } else if (file.endsWith('.md')) {
            markdownFiles.push(filePath);
        }
    });
}

// 태그를 추출하는 함수 (두 가지 패턴 처리)
function extractTags(content) {
    let tags = [];

    // 첫 번째 패턴: YAML 형식의 tags 추출
    const yamlPattern = /tags:\s*\n(?:\s*-?\s*(\w+\s*))+/g;  // 수정된 정규식
    const tagPattern = /\s*-\s*(\w+)/g;
    
    let match;
    while ((match = tagPattern.exec(content.match(yamlPattern))) !== null) {
        // match 출력
        console.log("Match found:", match);
    
        // match 결과에서 태그를 추출하여 tags 배열에 추가
        if (match[1]) {  // 첫 번째 캡처 그룹이 존재할 경우만 처리
            tags.push(match[1]);
        }
    }

    // 두 번째 패턴: #으로 시작하는 태그 추출
    const hashTagPattern = /#(\w+)/g;
    while ((match = hashTagPattern.exec(content)) !== null) {
         if (match[1]) {  // 첫 번째 캡처 그룹이 존재할 경우만 처리
            tags.push(match[1]);
        }
    }

    return tags;
}

// 노드와 링크 데이터를 생성하는 함수
function generateGraphData() {
    const nodes = [];
    const links = [];
    const tagMap = new Map(); // 각 태그가 포함된 .md 파일을 추적
    let nodeId = 0; // 숫자 ID 관리

    const nodeMap = new Map(); // 파일명/태그 -> ID 매핑

    markdownFiles.forEach(file => {
        const fileName = path.basename(file, '.md'); // 확장자 제거한 파일명
        const content = fs.readFileSync(file, 'utf-8');
        const tags = extractTags(content);

        // 파일을 노드로 추가 (id는 숫자, filename은 파일명, path는 경로)
        const fileNode = { id: nodeId, filename: fileName, path: file, group: 1 };
        nodes.push(fileNode);
        nodeMap.set(fileName, nodeId); // 파일명 -> ID 매핑
        nodeId++;

        // 태그들을 노드로 추가하고, 링크를 생성
        tags.forEach(tag => {
            let tagId;
            if (!nodeMap.has(tag)) {
                // 태그가 없으면 새로운 노드 추가
                tagId = nodeId;
                nodes.push({ id: tagId, filename: tag, group: 2 });
                nodeMap.set(tag, tagId);
                nodeId++;
            } else {
                tagId = nodeMap.get(tag);
            }

            // 태그와 파일 간의 링크 생성
            links.push({ source: tagId, target: fileNode.id, value: 1 });
        });
    });

    return { nodes, links };
}

// 파일을 생성하는 함수
function writeGraphData() {
    const graphData = generateGraphData();
    fs.writeFileSync('graphView.json', JSON.stringify(graphData, null, 2));
}

// 초기화 및 실행
findMarkdownFiles(repoPath);
writeGraphData();

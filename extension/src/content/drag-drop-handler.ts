import { DetectedFile } from './file-detector';

/**
 * Drag-and-Drop Handler
 * Manages dragging files from LLM UI to WorkGraph
 */
export class DragDropHandler {
    private dropZone: HTMLDivElement | null = null;

    constructor(private onFileDrop: (file: DetectedFile) => void) {
        this.setupGlobalListeners();
    }

    private setupGlobalListeners(): void {
        // Detect when user starts dragging a file element
        document.addEventListener('dragstart', (e) => {
            const target = e.target as HTMLElement;
            if (target.dataset.wgFile) {
                this.showDropZone();
            }
        });

        document.addEventListener('dragend', () => {
            this.hideDropZone();
        });
    }

    /**
     * Make a detected file draggable
     */
    makeDraggable(file: DetectedFile): void {
        file.element.draggable = true;
        file.element.dataset.wgFile = JSON.stringify({
            name: file.name,
            type: file.type,
            platform: file.platform,
            downloadUrl: file.downloadUrl
        });

        file.element.addEventListener('dragstart', (e) => {
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('application/wg-file', file.element.dataset.wgFile || '');
            }
        });
    }

    private showDropZone(): void {
        if (this.dropZone) return;

        this.dropZone = document.createElement('div');
        this.dropZone.className = 'wg-drop-zone';
        this.dropZone.innerHTML = `
            <div class="wg-drop-zone-content">
                <div class="wg-drop-icon">📥</div>
                <div class="wg-drop-text">Drop here to send to WorkGraph</div>
            </div>
        `;

        // Styling
        this.dropZone.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            height: 150px;
            background: rgba(59, 130, 246, 0.1);
            backdrop-filter: blur(10px);
            border: 2px dashed #3b82f6;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateY(20px);
        `;

        const style = document.createElement('style');
        style.textContent = `
            .wg-drop-zone-content {
                text-align: center;
                pointer-events: none;
            }
            .wg-drop-icon {
                font-size: 48px;
                margin-bottom: 8px;
                animation: bounce 1s infinite;
            }
            .wg-drop-text {
                color: #3b82f6;
                font-size: 14px;
                font-weight: 600;
            }
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            .wg-drop-zone.drag-over {
                background: rgba(59, 130, 246, 0.2);
                border-color: #2563eb;
                transform: scale(1.05);
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(this.dropZone);

        // Animate in
        setTimeout(() => {
            if (this.dropZone) {
                this.dropZone.style.opacity = '1';
                this.dropZone.style.transform = 'translateY(0)';
            }
        }, 10);

        // Setup drop handlers
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.dropZone) {
                this.dropZone.classList.add('drag-over');
            }
        });

        this.dropZone.addEventListener('dragleave', () => {
            if (this.dropZone) {
                this.dropZone.classList.remove('drag-over');
            }
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            const fileData = e.dataTransfer?.getData('application/wg-file');
            if (fileData) {
                const parsedData = JSON.parse(fileData);
                this.onFileDrop(parsedData as DetectedFile);
            }
            this.hideDropZone();
        });
    }

    private hideDropZone(): void {
        if (!this.dropZone) return;

        this.dropZone.style.opacity = '0';
        this.dropZone.style.transform = 'translateY(20px)';

        setTimeout(() => {
            this.dropZone?.remove();
            this.dropZone = null;
        }, 300);
    }
}

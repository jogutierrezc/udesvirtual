import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface QuillEditorProps {
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    className?: string;
    placeholder?: string;
}

const QuillEditor = forwardRef<Quill | null, QuillEditorProps>(({ value, defaultValue, onChange, className, placeholder }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);
    const onTextChangeRef = useRef<((...args: any[]) => void) | null>(null);

    useImperativeHandle(ref, () => quillRef.current);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const editorContainer = container.appendChild(
            container.ownerDocument.createElement('div')
        );

        const quill = new Quill(editorContainer, {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    [{ 'script': 'sub' }, { 'script': 'super' }],
                    [{ 'indent': '-1' }, { 'indent': '+1' }],
                    [{ 'direction': 'rtl' }],
                    [{ 'size': ['small', false, 'large', 'huge'] }],
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'font': [] }],
                    [{ 'align': [] }],
                    ['clean'],
                    ['link', 'image', 'video'],
                    ['table'] // Add table to toolbar
                ],
                table: true, // Enable table module
            },
            placeholder: placeholder,
        });

        quillRef.current = quill;

        if (defaultValue) {
            quill.clipboard.dangerouslyPasteHTML(defaultValue);
        } else if (value) {
            quill.clipboard.dangerouslyPasteHTML(value);
        }

        const handleTextChange = () => {
            if (onChange) {
                onChange(quill.getSemanticHTML());
            }
        };

        quill.on(Quill.events.TEXT_CHANGE, handleTextChange);
        onTextChangeRef.current = handleTextChange;

        return () => {
            quillRef.current = null;
            container.innerHTML = '';
        };
    }, []); // Run only once on mount

    // Sync value changes from prop if needed (be careful with loops)
    useEffect(() => {
        if (quillRef.current && value !== undefined) {
            const currentContent = quillRef.current.getSemanticHTML();
            if (value !== currentContent) {
                // Only update if significantly different to avoid cursor jumps
                // Ideally we'd use delta diffing, but for now simple check
                // This might cause cursor jump if typing fast and parent updates slow
                // Better to rely on internal state for typing and only use value for initial or external resets
                // For this use case (lesson editor), we usually just need initial load.
                // But let's try to be safe.
                const delta = quillRef.current.clipboard.convert({ html: value });
                quillRef.current.setContents(delta, 'silent');
            }
        }
    }, [value]);

    return <div ref={containerRef} className={className} />;
});

QuillEditor.displayName = 'QuillEditor';

export default QuillEditor;

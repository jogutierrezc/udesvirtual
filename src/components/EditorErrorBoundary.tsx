import React from "react";
import { Button } from "@/components/ui/button";

interface EditorErrorBoundaryProps {
  children: React.ReactNode;
}

interface EditorErrorBoundaryState {
  hasError: boolean;
}

export default class EditorErrorBoundary extends React.Component<
  EditorErrorBoundaryProps,
  EditorErrorBoundaryState
> {
  constructor(props: EditorErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): EditorErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("EditorErrorBoundary caught error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="w-full max-w-xl rounded-lg border bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Error al abrir el editor</h2>
            <p className="text-sm text-gray-600">
              Ocurrio un error inesperado en esta pantalla. Intenta recargar y volver a entrar.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => window.history.back()}>
                Volver
              </Button>
              <Button onClick={this.handleReload}>Recargar</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

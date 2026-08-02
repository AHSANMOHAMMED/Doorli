import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

let Updates: any = null;
try {
  Updates = require('expo-updates');
} catch {}

export default class ErrorBoundary extends Component<Props, State> {
  refs: { [key: string]: React.ReactInstance } = {};

  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    if (Updates?.reloadAsync) {
      Updates.reloadAsync();
    }
  };

  render() {
    if (this.state.hasError) {
      const isDev = __DEV__;
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          {isDev && this.state.error && (
            <Text style={styles.errorDetails}>{this.state.error.message}</Text>
          )}
          <TouchableOpacity style={styles.button} onPress={this.handleTryAgain}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
          {Updates?.reloadAsync && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={this.handleReload}
            >
              <Text style={styles.buttonText}>Reload App</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1B2B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1E88E5',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
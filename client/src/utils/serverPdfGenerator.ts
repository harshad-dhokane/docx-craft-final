
export const convertToPdfOnServer = async (file: File): Promise<Blob> => {
  const formData = new FormData();
  formData.append('file', file);

  console.log('Sending file to server for PDF conversion:', file.name);

  try {
    const response = await fetch('/api/convert-to-pdf', {
      method: 'POST',
      body: formData,
    });

    console.log('Server response status:', response.status);
    console.log('Server response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorMessage = 'PDF conversion failed on server';
      
      try {
        const errorData = await response.json();
        console.error('Server PDF conversion failed with detailed error:', errorData);
        errorMessage = errorData.error || errorData.message || `Server error: ${response.status} ${response.statusText}`;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        const errorText = await response.text();
        console.error('Raw error response:', errorText);
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    const pdfBlob = await response.blob();
    console.log('PDF conversion successful, received blob size:', pdfBlob.size);
    
    if (pdfBlob.size === 0) {
      throw new Error('Received empty PDF file from server');
    }
    
    return pdfBlob;
  } catch (networkError) {
    console.error('Network error during PDF conversion:', networkError);
    if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
      throw new Error('Unable to connect to PDF conversion server. Please try again later.');
    }
    throw networkError;
  }
};

export const checkServerHealth = async (): Promise<boolean> => {
  try {
    console.log('Checking server health...');
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('Health check response status:', response.status);
    
    if (!response.ok) {
      console.error('Health check failed with status:', response.status);
      return false;
    }
    
    const data = await response.json();
    console.log('Health check response:', data);
    
    const isHealthy = data.status === 'ok';
    console.log('Server health status:', isHealthy ? 'healthy' : 'unhealthy');
    
    return isHealthy;
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
};

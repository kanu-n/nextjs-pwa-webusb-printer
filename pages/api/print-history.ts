import { NextApiRequest, NextApiResponse } from 'next';

// In a real application, this would be stored in a database
let printHistory: any[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { limit = 50, status, printerId } = req.query;
    
    let filteredHistory = [...printHistory];
    
    // Filter by status if provided
    if (status && status !== 'all') {
      filteredHistory = filteredHistory.filter(job => job.status === status);
    }
    
    // Filter by printer if provided
    if (printerId) {
      filteredHistory = filteredHistory.filter(job => job.printerId === printerId);
    }
    
    // Sort by timestamp (newest first)
    filteredHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Limit results
    const limitNum = parseInt(limit as string);
    if (limitNum > 0) {
      filteredHistory = filteredHistory.slice(0, limitNum);
    }
    
    res.status(200).json({
      success: true,
      history: filteredHistory,
      total: printHistory.length
    });
    
  } else if (req.method === 'POST') {
    // Add new print job to history
    const { jobId, printerId, printerName, template, status = 'completed', data } = req.body;
    
    const historyEntry = {
      id: jobId || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      printerId,
      printerName,
      template,
      status,
      timestamp: new Date().toISOString(),
      dataSize: data ? data.length : 0,
      retries: 0,
      ...(req.body.error && { error: req.body.error })
    };
    
    printHistory.push(historyEntry);
    
    // Keep only last 1000 entries to prevent memory issues
    if (printHistory.length > 1000) {
      printHistory = printHistory.slice(-1000);
    }
    
    res.status(201).json({
      success: true,
      job: historyEntry
    });
    
  } else if (req.method === 'PUT') {
    // Update existing print job
    const { jobId, status, error, retries } = req.body;
    
    const jobIndex = printHistory.findIndex(job => job.id === jobId);
    
    if (jobIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Print job not found'
      });
    }
    
    // Update job
    if (status) printHistory[jobIndex].status = status;
    if (error) printHistory[jobIndex].error = error;
    if (retries !== undefined) printHistory[jobIndex].retries = retries;
    
    printHistory[jobIndex].lastUpdated = new Date().toISOString();
    
    res.status(200).json({
      success: true,
      job: printHistory[jobIndex]
    });
    
  } else if (req.method === 'DELETE') {
    const { jobId, clearAll } = req.body;
    
    if (clearAll) {
      printHistory = [];
      res.status(200).json({
        success: true,
        message: 'All print history cleared'
      });
    } else if (jobId) {
      const initialLength = printHistory.length;
      printHistory = printHistory.filter(job => job.id !== jobId);
      
      if (printHistory.length === initialLength) {
        return res.status(404).json({
          success: false,
          error: 'Print job not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Print job removed from history'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'jobId or clearAll required'
      });
    }
    
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

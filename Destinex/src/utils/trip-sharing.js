// Import libraries for PDF generation
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const sanitizePdfText = (value) =>
  String(value || '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

/**
 * Converts a trip page to PDF and triggers download
 * @param {string} elementId - The ID of the element to capture for the PDF
 * @param {string} filename - The name of the PDF file to download
 */
export const downloadTripAsPDF = async (elementId, filename = 'trip-plan.pdf') => {
  try {
    const element =
      typeof elementId === 'string'
        ? document.getElementById(elementId)
        : (elementId instanceof Element ? elementId : null);
    
    if (!element) {
      console.error(`Element with ID ${elementId} not found`);
      return false;
    }
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 8;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    let renderedWithImage = false;
    try {
      const capturePromise = html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 10000,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        scrollX: 0,
        scrollY: -window.scrollY,
        onclone: (doc) => {
          doc.querySelectorAll('[data-pdf-ignore="true"]').forEach((node) => {
            node.remove();
          });
        },
        ignoreElements: (node) => {
          if (!(node instanceof Element)) return false;
          if (node.getAttribute('data-pdf-ignore') === 'true') return true;
          if (node.classList.contains('leaflet-container')) return true;
          if (node.classList.contains('mapboxgl-map')) return true;
          return false;
        },
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PDF capture timed out')), 12000)
      );
      const canvas = await Promise.race([capturePromise, timeoutPromise]);

      const imgData = canvas.toDataURL('image/png');
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = imgHeight;
      let yPosition = margin;

      pdf.addImage(imgData, 'PNG', margin, yPosition, contentWidth, imgHeight);
      heightLeft -= contentHeight;

      while (heightLeft > 0) {
        yPosition = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, yPosition, contentWidth, imgHeight);
        heightLeft -= contentHeight;
      }
      renderedWithImage = true;
    } catch (captureError) {
      console.warn('Image PDF capture failed, using text fallback:', captureError);
    }

    if (!renderedWithImage) {
      // Reliable fallback when canvas/image capture fails due CORS or browser constraints.
      try {
        const plainText = String(element.innerText || '').replace(/\n{3,}/g, '\n\n').trim();
        const textToWrite = sanitizePdfText(plainText) || 'Trip details unavailable.';
        const lines = pdf.splitTextToSize(textToWrite, contentWidth);
        let y = margin + 2;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        pdf.text('Trip Itinerary', margin, y);
        y += 8;

        lines.forEach((line) => {
          if (y > pageHeight - margin) {
            pdf.addPage();
            y = margin + 2;
          }
          pdf.text(String(line), margin, y);
          y += 6;
        });
      } catch (textError) {
        console.error('Text fallback failed:', textError);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        pdf.text('Trip Itinerary', margin, margin + 6);
        pdf.text('Could not render full content. Please try again.', margin, margin + 14);
      }
    }

    const safeFilename = String(filename || 'trip-plan')
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
    const finalFilename = safeFilename.toLowerCase().endsWith('.pdf')
      ? safeFilename
      : `${safeFilename}.pdf`;

    pdf.save(finalFilename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

/**
 * Copies the current trip URL to clipboard
 * @returns {Promise<boolean>} Success status
 */
export const copyTripLink = async () => {
  try {
    const currentUrl = window.location.href;
    await navigator.clipboard.writeText(currentUrl);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

/**
 * Opens email client with trip details
 * @param {string} tripTitle - The title of the trip
 * @param {string} tripLocation - The location of the trip
 * @returns {boolean} Success status
 */
export const shareTripViaEmail = (tripTitle, tripLocation) => {
  try {
    const subject = encodeURIComponent(`Check out my travel plan to ${tripLocation}!`);
    const body = encodeURIComponent(
      `Hi there,\n\nI've created a travel plan for ${tripTitle} using AI Travel Guide. Check it out here: ${window.location.href}\n\nEnjoy!`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
    return true;
  } catch (error) {
    console.error('Error opening email client:', error);
    return false;
  }
}; 

/**
 * Generates a booking bill PDF and triggers download.
 * @param {{trip: object, booking: object}} payload
 * @returns {Promise<boolean>} Success status
 */
export const downloadBookingBillAsPDF = async ({ trip, booking }) => {
  try {
    if (!trip || !booking) return false;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 14;
    let y = 20;
    const lineHeight = 8;
    const pageHeight = 297;

    const destination =
      trip?.userSelection?.location?.label ||
      trip?.tripData?.destination ||
      'Destination';
    const totalAmount = Number(booking?.packageAmount || 0);
    const transactionId = booking?.payment?.transactionId || 'N/A';
    const billNumber = booking?.bill?.billNumber || 'N/A';
    const paymentMethod = booking?.payment?.method || 'N/A';
    const paidAt = booking?.payment?.paidAt || booking?.bookedAt || new Date().toISOString();
    const traveler = trip?.userSelection?.traveler || 'Traveler';
    const days = trip?.userSelection?.noOfDays || 'N/A';
    const budgetType = trip?.userSelection?.budget || 'N/A';
    const tripReference = trip?.id || 'N/A';
    const travelerEmail = trip?.userEmail || 'N/A';
    const issuedAt = booking?.bill?.issuedAt || booking?.bookedAt || paidAt;
    const hotels = Array.isArray(trip?.tripData?.hotels) ? trip.tripData.hotels : [];
    const itinerary = Array.isArray(trip?.tripData?.itinerary) ? trip.tripData.itinerary : [];
    const activities = itinerary.flatMap((day) => (Array.isArray(day?.plan) ? day.plan : []));
    const preferences = trip?.userSelection?.preferences || {};
    const selectedPreferences = [
      ...(Array.isArray(preferences.locationTypes) ? preferences.locationTypes : []),
      ...(Array.isArray(preferences.learning) ? preferences.learning : []),
      ...(Array.isArray(preferences.activities) ? preferences.activities : []),
      ...(Array.isArray(preferences.relaxation) ? preferences.relaxation : []),
    ].filter(Boolean);

    const inrFormatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });

    const addLine = (label, value) => {
      if (y > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${sanitizePdfText(label)}:`, margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(sanitizePdfText(value), margin + 48, y);
      y += lineHeight;
    };

    const addParagraph = (label, value) => {
      if (y > pageHeight - margin - 12) {
        pdf.addPage();
        y = margin;
      }
      const content = sanitizePdfText(value) || 'N/A';
      const lines = pdf.splitTextToSize(content, 130);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${sanitizePdfText(label)}:`, margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(lines, margin + 48, y);
      y += Math.max(lineHeight, lines.length * 6);
    };

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('Trip Package Booking Bill', margin, y);
    y += 10;

    pdf.setDrawColor(220, 220, 220);
    pdf.line(margin, y, 210 - margin, y);
    y += 10;

    pdf.setFontSize(12);
    addLine('Bill Number', billNumber);
    addLine('Transaction ID', transactionId);
    addLine('Booking Status', String(booking?.status || 'booked').toUpperCase());
    addLine('Paid Amount', inrFormatter.format(totalAmount));
    addLine('Payment Method', paymentMethod);
    addLine('Paid On', new Date(paidAt).toLocaleString());
    addLine('Destination', destination);
    addLine('Duration', `${days} day(s)`);
    addLine('Traveler Type', String(traveler));
    addLine('Budget Type', String(budgetType));
    addLine('Trip Reference', String(tripReference));
    addLine('Traveler Email', String(travelerEmail));
    addLine('Bill Issued At', new Date(issuedAt).toLocaleString());
    addLine('Hotels Included', String(hotels.length));
    addLine('Itinerary Days', String(itinerary.length || days));
    addLine('Activities Included', String(activities.length));
    addParagraph(
      'Selected Preferences',
      selectedPreferences.length > 0 ? selectedPreferences.join(', ') : 'Standard package'
    );
    addParagraph(
      'Top Hotels',
      hotels.slice(0, 5).map((hotel) => hotel?.hotelName || hotel?.name).filter(Boolean).join(', ') || 'N/A'
    );
    addParagraph(
      'Top Activities',
      activities.slice(0, 8).map((place) => place?.placeName || place?.name).filter(Boolean).join(', ') || 'N/A'
    );

    y += 8;
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    const footer =
      'This is a system generated bill for your booked travel package.';
    pdf.text(sanitizePdfText(footer), margin, y);

    const safeName = sanitizePdfText(destination).replace(/\s+/g, '-').toLowerCase() || 'trip';
    pdf.save(`bill-${safeName}-${billNumber}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating booking bill PDF:', error);
    return false;
  }
};

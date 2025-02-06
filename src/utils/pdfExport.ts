import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

export const exportToPDF = async (title: string, data: any) => {
  let reportTitle = title;
  if (data.data && data.rangeType) {
    if (data.rangeType === 'week') {
      reportTitle = 'Weekly Occupancy Report';
    } else if (data.rangeType === 'month') {
      reportTitle = 'Monthly Occupancy Report';
    }
  }

  // Create a container element and force text to be black.
  const element = document.createElement('div');
  element.style.padding = '20px';
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  element.style.color = 'black'; // Ensure inherited text is black

  // Build the report content.
  const content = document.createElement('div');
  content.innerHTML = `
    <h1 style="color: black; margin-bottom: 20px;">${reportTitle}</h1>
  `;

  // Range view export.
  if (data.data && Object.keys(data.data).length > 0) {
    // Flatten records
    const allRecords = Object.entries(data.data).flatMap(
      ([date, dayData]: [string, any]) =>
        (dayData.records || []).map((room: any) => ({ date, room }))
    );

    content.innerHTML += `
      <div style="margin-bottom: 20px; color: black;">
        <h2>All Rooms (Range View)</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; color: black;">Date</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; color: black;">Room Number</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; color: black;">Category</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; color: black;">Check-in Time</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; color: black;">Check-out Time</th>
            </tr>
          </thead>
          <tbody>
            ${allRecords
              .map(({ date, room }: { date: string; room: any }) => {
                const isError =
                  room.check_in_unixstamp &&
                  room.check_out_unixstamp &&
                  room.check_out_unixstamp - room.check_in_unixstamp <= 1800;
                let statusText = '';
                if (isError) {
                  statusText = `<strong style="color: red;">Error</strong>`;
                } else {
                  const statuses = [];
                  if (room.checkInCategory === 'early') {
                    statuses.push(`<strong>Early Check-in</strong>`);
                  }
                  if (
                    room.check_out_unixstamp &&
                    room.checkOutCategory === 'late'
                  ) {
                    statuses.push(`<strong>Late Check-out</strong>`);
                  }
                  statusText = statuses.join(', ');
                }
                const roomDisplay = statusText
                  ? `Room ${room.roomid} (${statusText})`
                  : `Room ${room.roomid}`;

                return `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; color: black;">${format(
                      new Date(date),
                      'MMM d, yyyy'
                    )}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; color: black;">${roomDisplay}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; color: black;">${
                      room.room_category
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 8px; color: black;">${
                      room.check_in_unixstamp
                        ? format(
                            new Date(room.check_in_unixstamp * 1000),
                            'MMM d, h:mm a'
                          )
                        : '-'
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 8px; color: black;">${
                      room.check_out_unixstamp
                        ? format(
                            new Date(room.check_out_unixstamp * 1000),
                            'MMM d, h:mm a'
                          )
                        : 'Not checked out'
                    }</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (data.records) {
    // Day view export.
    const earlyCheckInsCount = data.records.filter(
      (room: any) => room.checkInCategory === 'early'
    ).length;
    const lateCheckOutsCount = data.records.filter(
      (room: any) =>
        room.check_out_unixstamp && room.checkOutCategory === 'late'
    ).length;

    content.innerHTML += `
      <div style="margin-bottom: 20px; color: black;">
        <h2>Daily Summary:</h2>
        <p>Occupancy Rate: ${data.summary.occupancyPercentage}%</p>
        <p>Occupied Rooms: ${data.summary.occupiedRooms}</p>
        <p>Total Rooms: ${data.summary.totalRooms}</p>
        <p>Early Check-ins: ${earlyCheckInsCount}</p>
        <p>Late Check-outs: ${lateCheckOutsCount}</p>
      </div>
      <div style="margin-bottom: 20px; color: black;">
        <h2>All Rooms</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; color: black;">Room Number</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; color: black;">Category</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; color: black;">Check-in Time</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; color: black;">Check-out Time</th>
            </tr>
          </thead>
          <tbody>
            ${data.records
              .map((room: any) => {
                const isError =
                  room.check_in_unixstamp &&
                  room.check_out_unixstamp &&
                  room.check_out_unixstamp - room.check_in_unixstamp <= 1800;
                let statusText = '';
                if (isError) {
                  statusText = `<strong style="color: red;">Error</strong>`;
                } else {
                  const statuses = [];
                  if (room.checkInCategory === 'early') {
                    statuses.push(`<strong>Early Check-in</strong>`);
                  }
                  if (
                    room.check_out_unixstamp &&
                    room.checkOutCategory === 'late'
                  ) {
                    statuses.push(`<strong>Late Check-out</strong>`);
                  }
                  statusText = statuses.join(', ');
                }
                const roomDisplay = statusText
                  ? `Room ${room.roomid} (${statusText})`
                  : `Room ${room.roomid}`;

                return `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; color: black;">${roomDisplay}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; color: black;">${
                      room.room_category
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 8px; color: black;">${
                      room.check_in_unixstamp
                        ? format(
                            new Date(room.check_in_unixstamp * 1000),
                            'MMM d, h:mm a'
                          )
                        : '-'
                    }</td>
                    <td style="border: 1px solid #ddd; padding: 8px; color: black;">${
                      room.check_out_unixstamp
                        ? format(
                            new Date(room.check_out_unixstamp * 1000),
                            'MMM d, h:mm a'
                          )
                        : 'Not checked out'
                    }</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  element.appendChild(content);
  document.body.appendChild(element);

  try {
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4',
    });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate scaled image dimensions.
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add the first page.
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Add extra pages if needed.
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`${reportTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  } finally {
    document.body.removeChild(element);
  }
};
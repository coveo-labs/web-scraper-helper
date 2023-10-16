import { Component, State, h } from '@stencil/core';
import { getMetadataResults } from '../store';

@Component({
  tag: 'metadata-results',
  styleUrl: 'metadata-results.css',
  shadow: true,
})
export class MetadataResults {
  @State() results: any;

  async componentWillRender() {
    // needs to be fixed
    this.results = await getMetadataResults();
    console.log('results', this.results);
  }

  render() {
    return (
      <div class="result-container">
        <table id="resultGlobalTable" class="table table-condensed table-bordered">
          <thead>
            <tr>
              <th>Metadata name</th>
              <th>Value(s)</th>
            </tr>
          </thead>
          <tbody>
            {this.results.length &&
              this.results.map(item => {
                return (
                  <tr>
                    <td>{item.name}</td>
                    <td>
                      {item.value.length &&
                        item.value.map((val, idx) => {
                          return <li key={idx}>{val}</li>;
                        })}
                    </td>
                  </tr>
                );
              })}

            <tr>
              <td>3</td>
              <td>4</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}
